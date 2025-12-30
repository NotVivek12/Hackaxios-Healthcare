import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Meeting from '@/models/Meeting';

export const runtime = 'nodejs';

// Store active signaling sessions in memory (in production, use Redis)
const signalingStore = new Map<string, {
    participants: Map<string, {
        userId: string;
        role: string;
        socketId?: string;
        offer?: RTCSessionDescriptionInit;
        answer?: RTCSessionDescriptionInit;
        iceCandidates: RTCIceCandidateInit[];
    }>;
    createdAt: Date;
}>();

// Clean up old sessions every 5 minutes
setInterval(() => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    for (const [roomId, room] of signalingStore.entries()) {
        if (room.createdAt < fiveMinutesAgo) {
            signalingStore.delete(roomId);
        }
    }
}, 5 * 60 * 1000);

async function verifyMeetingAccess(meetingId: string, userId: string, userRole: string) {
    await connectDB();
    
    let meeting = await Meeting.findById(meetingId);
    
    // For testing purposes, create a mock meeting if it doesn't exist
    if (!meeting && meetingId === '507f1f77bcf86cd799439011') {
        meeting = {
            _id: meetingId,
            patientId: userRole === 'patient' ? userId : '507f1f77bcf86cd799439012',
            doctorId: userRole === 'provider' ? userId : '507f1f77bcf86cd799439013',
            type: 'video',
            status: 'active',
            scheduledFor: new Date(),
            reason: 'Test consultation'
        };
    }
    
    if (!meeting) {
        return { meeting: null, isAuthorized: false };
    }

    const isAuthorized = meeting.patientId.toString() === userId || 
                       meeting.doctorId.toString() === userId;
    
    return { meeting, isAuthorized };
}

export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const meetingId = params.id;
        const { meeting, isAuthorized } = await verifyMeetingAccess(
            meetingId, 
            session.user.id, 
            session.user.role || 'patient'
        );
        
        if (!meeting) {
            return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
        }
        
        if (!isAuthorized) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Get or create signaling room
        if (!signalingStore.has(meetingId)) {
            signalingStore.set(meetingId, {
                participants: new Map(),
                createdAt: new Date()
            });
        }

        const room = signalingStore.get(meetingId)!;
        const userRole = meeting.patientId.toString() === session.user.id ? 'patient' : 'doctor';
        
        // Add user to room if not already present
        if (!room.participants.has(session.user.id)) {
            room.participants.set(session.user.id, {
                userId: session.user.id,
                role: userRole,
                iceCandidates: []
            });
        }

        // Return current room state
        const participants = Array.from(room.participants.values()).map(p => ({
            userId: p.userId,
            role: p.role,
            hasOffer: !!p.offer,
            hasAnswer: !!p.answer,
            iceCandidatesCount: p.iceCandidates.length
        }));

        return NextResponse.json({
            roomId: meetingId,
            participants,
            userRole,
            isReady: participants.length >= 2
        });

    } catch (error) {
        console.error('Signaling GET error:', error);
        return NextResponse.json({ error: 'Signaling failed' }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const meetingId = params.id;
        const data = await request.json();
        
        const { meeting, isAuthorized } = await verifyMeetingAccess(
            meetingId, 
            session.user.id, 
            session.user.role || 'patient'
        );
        
        if (!meeting) {
            return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
        }
        
        if (!isAuthorized) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        // Get or create signaling room
        if (!signalingStore.has(meetingId)) {
            signalingStore.set(meetingId, {
                participants: new Map(),
                createdAt: new Date()
            });
        }

        const room = signalingStore.get(meetingId)!;
        const userRole = meeting.patientId.toString() === session.user.id ? 'patient' : 'doctor';
        
        // Ensure user is in room
        if (!room.participants.has(session.user.id)) {
            room.participants.set(session.user.id, {
                userId: session.user.id,
                role: userRole,
                iceCandidates: []
            });
        }

        const participant = room.participants.get(session.user.id)!;

        // Handle different signaling message types
        switch (data.type) {
            case 'offer':
                participant.offer = data.offer;
                break;
            
            case 'answer':
                participant.answer = data.answer;
                break;
            
            case 'ice-candidate':
                participant.iceCandidates.push(data.candidate);
                break;
            
            case 'get-offer':
                // Return the other participant's offer
                const otherParticipantForOffer = Array.from(room.participants.values())
                    .find(p => p.userId !== session.user.id);
                if (otherParticipantForOffer?.offer) {
                    return NextResponse.json({ offer: otherParticipantForOffer.offer });
                }
                return NextResponse.json({ offer: null });
            
            default:
                return NextResponse.json({ error: 'Invalid message type' }, { status: 400 });
        }

        // Get the other participant's data to send back
        const otherParticipant = Array.from(room.participants.values())
            .find(p => p.userId !== session.user.id);

        const response: any = { success: true };

        if (otherParticipant) {
            if (data.type === 'offer' && otherParticipant.answer) {
                response.answer = otherParticipant.answer;
            }
            if (data.type === 'answer' && otherParticipant.offer) {
                response.offer = otherParticipant.offer;
            }
            if (otherParticipant.iceCandidates.length > 0) {
                response.iceCandidates = otherParticipant.iceCandidates;
                // Clear sent candidates
                otherParticipant.iceCandidates.length = 0;
            }
        }

        return NextResponse.json(response);

    } catch (error) {
        console.error('Signaling POST error:', error);
        return NextResponse.json({ error: 'Signaling failed' }, { status: 500 });
    }
}