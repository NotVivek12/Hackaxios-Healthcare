import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import User from '@/models/User';
import Notification from '@/models/Notification';
import { ActivityRecord, buildNotificationsFromActivities } from '@/lib/notifications';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    
    // Get meeting notifications from Notification model
    interface NotificationDoc {
      _id: { toString(): string };
      type: string;
      title: string;
      message: string;
      read: boolean;
      createdAt: Date;
      metadata?: Record<string, unknown>;
      referenceId?: { toString(): string };
    }
    
    const meetingNotifications = await Notification.find({ 
      userId: session.user.id 
    })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean() as unknown as NotificationDoc[];

    // Get activity-based notifications from user
    const user = await User.findById(session.user.id)
      .select('recentActivities')
      .lean() as { recentActivities?: ActivityRecord[] } | null;

    const activities: ActivityRecord[] = Array.isArray(user?.recentActivities) ? user!.recentActivities! : [];
    const activityNotifications = buildNotificationsFromActivities(activities, 10);

    // Format meeting notifications
    const formattedMeetingNotifications = meetingNotifications.map(notif => ({
      id: notif._id.toString(),
      type: notif.type,
      title: notif.title,
      message: notif.message,
      read: notif.read,
      timestamp: notif.createdAt,
      metadata: notif.metadata,
      referenceId: notif.referenceId?.toString(),
    }));

    // Combine and sort all notifications
    const allNotifications = [...formattedMeetingNotifications, ...activityNotifications]
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 20);

    return NextResponse.json({ notifications: allNotifications });
  } catch (err) {
    console.error('Notifications fetch error:', err);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

// PATCH: Mark notifications as read
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await request.json();
    await connectDB();

    if (data.markAllRead) {
      await Notification.updateMany(
        { userId: session.user.id, read: false },
        { $set: { read: true } }
      );
    } else if (data.notificationId) {
      await Notification.findOneAndUpdate(
        { _id: data.notificationId, userId: session.user.id },
        { $set: { read: true } }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Notification update error:', err);
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}

export const runtime = 'nodejs';