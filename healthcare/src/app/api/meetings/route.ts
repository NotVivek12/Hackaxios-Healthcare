import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import Meeting from '@/models/Meeting';
import Notification from '@/models/Notification';
import User from '@/models/User';

export const runtime = 'nodejs';

// GET: Fetch meetings for the current user
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();

        const searchParams = request.nextUrl.searchParams;
        const status = searchParams.get('status');
        const role = session.user.role;

        // Build query based on user role
        interface MeetingQuery {
            patientId?: string;
            doctorId?: string;
            status?: string | { $in: string[] };
        }
        
        let query: MeetingQuery = {};

        if (role === 'provider') {
            query.doctorId = session.user.id;
        } else {
            query.patientId = session.user.id;
        }

        if (status) {
            query.status = status;
        } else {
            // By default, show scheduled and active meetings
            query.status = { $in: ['scheduled', 'active'] };
        }

        const meetings = await Meeting.find(query)
            .populate('patientId', 'name email')
            .populate('doctorId', 'name email profile.specialty')
            .sort({ scheduledFor: 1 })
            .lean();

        // Format the response
        const formattedMeetings = meetings.map(meeting => ({
            _id: meeting._id,
            type: meeting.type,
            status: meeting.status,
            scheduledFor: meeting.scheduledFor,
            reason: meeting.reason,
            roomId: meeting.roomId,
            patient: meeting.patientId ? {
                _id: (meeting.patientId as { _id: string })._id,
                name: (meeting.patientId as { name: string }).name,
                email: (meeting.patientId as { email: string }).email,
            } : null,
            doctor: meeting.doctorId ? {
                _id: (meeting.doctorId as { _id: string })._id,
                name: (meeting.doctorId as { name: string }).name,
                email: (meeting.doctorId as { email: string }).email,
                specialty: (meeting.doctorId as { profile?: { specialty?: string } }).profile?.specialty,
            } : null,
            createdAt: meeting.createdAt,
        }));

        return NextResponse.json(formattedMeetings);
    } catch (error) {
        console.error('Error fetching meetings:', error);
        return NextResponse.json({ error: 'Failed to fetch meetings' }, { status: 500 });
    }
}

// POST: Create a new meeting
export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await request.json();

        // Validate required fields
        if (!data.doctorId || !data.scheduledFor || !data.reason || !data.type) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await connectToDatabase();

        // Verify the doctor exists and is a provider
        const doctor = await User.findById(data.doctorId);
        if (!doctor || doctor.role !== 'provider') {
            return NextResponse.json({ error: 'Invalid doctor selected' }, { status: 400 });
        }

        // Get patient info
        const patient = await User.findById(session.user.id);

        // Create the meeting
        const meeting = new Meeting({
            patientId: session.user.id,
            doctorId: data.doctorId,
            type: data.type,
            status: 'scheduled',
            scheduledFor: new Date(data.scheduledFor),
            reason: data.reason,
        });

        await meeting.save();

        // Create notification for the doctor
        const notification = new Notification({
            userId: data.doctorId,
            type: 'meeting_scheduled',
            title: 'New Meeting Scheduled',
            message: `${patient?.name || 'A patient'} has scheduled a ${data.type} consultation with you.`,
            referenceId: meeting._id,
            referenceModel: 'Meeting',
            metadata: {
                meetingType: data.type,
                patientName: patient?.name,
                scheduledFor: meeting.scheduledFor,
            },
        });

        await notification.save();

        return NextResponse.json({
            success: true,
            meeting: {
                _id: meeting._id,
                roomId: meeting.roomId,
                type: meeting.type,
                status: meeting.status,
                scheduledFor: meeting.scheduledFor,
            },
        });
    } catch (error) {
        console.error('Error creating meeting:', error);
        return NextResponse.json({ error: 'Failed to create meeting' }, { status: 500 });
    }
}
