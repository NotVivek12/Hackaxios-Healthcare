import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import Meeting from '@/models/Meeting';

export const runtime = 'nodejs';

// In-memory signal storage (for MVP - in production use Redis)
const signalStore: Map<string, { from: string; signal: unknown; timestamp: number }[]> = new Map();

// Clean old signals (older than 30 seconds)
function cleanOldSignals(roomId: string) {
    const signals = signalStore.get(roomId) || [];
    const now = Date.now();
    const filtered = signals.filter(s => now - s.timestamp < 30000);
    signalStore.set(roomId, filtered);
}

// GET: Poll for signals
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: meetingId } = await params;
        await connectToDatabase();

        const meeting = await Meeting.findById(meetingId).lean() as { roomId?: string } | null;
        if (!meeting) {
            return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
        }

        const roomId = meeting.roomId || meetingId;
        cleanOldSignals(roomId);

        const signals = signalStore.get(roomId) || [];
        // Get signals not from the current user
        const userSignals = signals.filter(s => s.from !== session.user.id);
        
        // Remove the signals we're returning
        if (userSignals.length > 0) {
            signalStore.set(roomId, signals.filter(s => s.from === session.user.id));
        }

        return NextResponse.json({ signals: userSignals });
    } catch (error) {
        console.error('Error getting signals:', error);
        return NextResponse.json({ error: 'Failed to get signals' }, { status: 500 });
    }
}

// POST: Send a signal
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id: meetingId } = await params;
        const { signal, type } = await request.json();

        await connectToDatabase();

        const meeting = await Meeting.findById(meetingId).lean() as { roomId?: string } | null;
        if (!meeting) {
            return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
        }

        const roomId = meeting.roomId || meetingId;
        cleanOldSignals(roomId);

        const signals = signalStore.get(roomId) || [];
        signals.push({
            from: session.user.id,
            signal: { ...signal, type },
            timestamp: Date.now(),
        });
        signalStore.set(roomId, signals);

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error sending signal:', error);
        return NextResponse.json({ error: 'Failed to send signal' }, { status: 500 });
    }
}
