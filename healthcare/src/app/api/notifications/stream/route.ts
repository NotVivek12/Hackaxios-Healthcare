import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { ActivityRecord, buildNotificationsFromActivities } from '@/lib/notifications';

const encoder = new TextEncoder();
const HEARTBEAT_INTERVAL = 15000;
const REFRESH_INTERVAL = 12000;

export async function GET(request: Request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectDB();

        let closed = false;

        let cleanupFn: (() => void) | null = null;
        const stream = new ReadableStream({
            start(controller) {
                let previousIds = new Set<string>();
                let heartbeat: ReturnType<typeof setInterval> | null = null;
                let refreshInterval: ReturnType<typeof setInterval> | null = null;
                const cleanup = () => {
                    if (heartbeat) clearInterval(heartbeat);
                    if (refreshInterval) clearInterval(refreshInterval);
                };
                cleanupFn = cleanup;

                const push = (data: unknown) => {
                    controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
                };

                const sendSnapshot = async () => {
                    try {
                        const user = await User.findById(session.user.id)
                            .select('recentActivities')
                            .lean() as { recentActivities?: ActivityRecord[] } | null;

                        const activities: ActivityRecord[] = Array.isArray(user?.recentActivities) ? user!.recentActivities! : [];
                        const notifications = buildNotificationsFromActivities(activities, 20);
                        const currentIds = new Set(notifications.map((n) => n.id));
                        const hasDiff = notifications.length !== previousIds.size || notifications.some((item) => !previousIds.has(item.id));
                        if (hasDiff) {
                            push({ notifications });
                            previousIds = currentIds;
                        }
                    } catch (error) {
                        console.error('Notifications stream snapshot error:', error);
                        controller.enqueue(encoder.encode(`event: error\ndata: ${JSON.stringify({ message: 'stream-error' })}\n\n`));
                    }
                };

                heartbeat = setInterval(() => {
                    controller.enqueue(encoder.encode(': ping\n\n'));
                }, HEARTBEAT_INTERVAL);

                refreshInterval = setInterval(() => {
                    sendSnapshot().catch(() => {
                        // handled inside sendSnapshot
                    });
                }, REFRESH_INTERVAL);

                // Immediately send data
                sendSnapshot().catch(() => {
                    // ignore initial error
                });

                const close = () => {
                    if (closed) return;
                    closed = true;
                    cleanup();
                    controller.close();
                };

                request.signal.addEventListener('abort', close);
            },
            cancel() {
                if (!closed) {
                    closed = true;
                    cleanupFn?.();
                }
            }
        });

        return new Response(stream, {
            headers: {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache, no-transform',
                Connection: 'keep-alive'
            }
        });
    } catch (error) {
        console.error('Notifications stream error:', error);
        return NextResponse.json({ error: 'Failed to start notification stream' }, { status: 500 });
    }
}

export const runtime = 'nodejs';
