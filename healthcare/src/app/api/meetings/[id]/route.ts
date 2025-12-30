import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import Meeting from '@/models/Meeting';
import Notification from '@/models/Notification';
import User from '@/models/User';

export const runtime = 'nodejs';

// GET: Fetch a specific meeting by ID
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        await connectToDatabase();

        const meeting = await Meeting.findById(id)
            .populate('patientId', 'name email')
            .populate('doctorId', 'name email profile.specialty')
            .lean() as {
                _id: string;
                patientId: { _id: string; name: string; email: string } | null;
                doctorId: { _id: string; name: string; email: string; profile?: { specialty?: string } } | null;
                type: string;
                status: string;
                scheduledFor: Date;
                reason: string;
                roomId: string;
                messages: Array<{ senderId: string; senderName: string; senderRole: string; content: string; timestamp: Date }>;
            } | null;

        if (!meeting) {
            return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
        }

        // Verify user has access to this meeting
        const patientId = meeting.patientId?._id?.toString();
        const doctorId = meeting.doctorId?._id?.toString();
        
        if (patientId !== session.user.id && doctorId !== session.user.id) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        return NextResponse.json({
            _id: meeting._id,
            type: meeting.type,
            status: meeting.status,
            scheduledFor: meeting.scheduledFor,
            reason: meeting.reason,
            roomId: meeting.roomId,
            messages: meeting.messages || [],
            patient: meeting.patientId ? {
                _id: patientId,
                name: meeting.patientId.name,
                email: meeting.patientId.email,
            } : null,
            doctor: meeting.doctorId ? {
                _id: doctorId,
                name: meeting.doctorId.name,
                email: meeting.doctorId.email,
                specialty: meeting.doctorId.profile?.specialty,
            } : null,
        });
    } catch (error) {
        console.error('Error fetching meeting:', error);
        return NextResponse.json({ error: 'Failed to fetch meeting' }, { status: 500 });
    }
}

// PATCH: Update meeting status or add messages
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const data = await request.json();
        
        await connectToDatabase();

        const meeting = await Meeting.findById(id);

        if (!meeting) {
            return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
        }

        // Verify user has access to this meeting
        if (meeting.patientId.toString() !== session.user.id && 
            meeting.doctorId.toString() !== session.user.id) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Update status if provided
        if (data.status) {
            const validStatuses = ['scheduled', 'active', 'ended', 'cancelled'];
            if (!validStatuses.includes(data.status)) {
                return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
            }

            meeting.status = data.status;

            if (data.status === 'active') {
                meeting.startedAt = new Date();

                // Notify the other party
                const otherUserId = meeting.patientId.toString() === session.user.id 
                    ? meeting.doctorId 
                    : meeting.patientId;
                
                const currentUser = await User.findById(session.user.id);

                await Notification.create({
                    userId: otherUserId,
                    type: 'meeting_active',
                    title: 'Meeting Started',
                    message: `${currentUser?.name || 'Someone'} has started the meeting. Join now!`,
                    referenceId: meeting._id,
                    referenceModel: 'Meeting',
                });
            }

            if (data.status === 'ended') {
                meeting.endedAt = new Date();
            }
        }

        // Add message if provided
        if (data.message) {
            const user = await User.findById(session.user.id);
            meeting.messages.push({
                senderId: session.user.id,
                senderName: user?.name || 'Unknown',
                senderRole: session.user.role,
                content: data.message,
                timestamp: new Date(),
            });
        }

        await meeting.save();

        return NextResponse.json({
            success: true,
            meeting: {
                _id: meeting._id,
                status: meeting.status,
                roomId: meeting.roomId,
            },
        });
    } catch (error) {
        console.error('Error updating meeting:', error);
        return NextResponse.json({ error: 'Failed to update meeting' }, { status: 500 });
    }
}

// DELETE: Cancel a meeting
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        await connectToDatabase();

        const meeting = await Meeting.findById(id);

        if (!meeting) {
            return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
        }

        // Verify user has access to this meeting
        if (meeting.patientId.toString() !== session.user.id && 
            meeting.doctorId.toString() !== session.user.id) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Cancel the meeting
        meeting.status = 'cancelled';
        await meeting.save();

        // Notify the other party
        const otherUserId = meeting.patientId.toString() === session.user.id 
            ? meeting.doctorId 
            : meeting.patientId;
        
        const currentUser = await User.findById(session.user.id);

        await Notification.create({
            userId: otherUserId,
            type: 'meeting_cancelled',
            title: 'Meeting Cancelled',
            message: `${currentUser?.name || 'Someone'} has cancelled the meeting.`,
            referenceId: meeting._id,
            referenceModel: 'Meeting',
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error('Error cancelling meeting:', error);
        return NextResponse.json({ error: 'Failed to cancel meeting' }, { status: 500 });
    }
}
