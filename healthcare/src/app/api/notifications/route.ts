import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import { ActivityRecord, buildNotificationsFromActivities } from '@/lib/notifications';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.user.id)
      .select('recentActivities')
      .lean() as { recentActivities?: ActivityRecord[] } | null;

    const activities: ActivityRecord[] = Array.isArray(user?.recentActivities) ? user!.recentActivities! : [];
    const notifications = buildNotificationsFromActivities(activities, 20);

    return NextResponse.json({ notifications });
  } catch (err) {
    console.error('Notifications fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

export const runtime = 'nodejs';