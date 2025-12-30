import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import Meeting from '@/models/Meeting';

export const runtime = 'nodejs';

// Store active signaling sessions in memory (in production, use Redis)
interface SignalEntry {
    oderId: string;
    odername: string;
    signal: any;
    timestamp: number;
}

interface RoomData {
    participants: Map<string, {
        oderId: string;
        role: string;
        // For native WebRTC
        offer?: RTCSessionDescriptionInit;
        answer?: RTCSessionDescriptionInit;
        iceCandidates: RTCIceCandidateInit[];
    }>;
    // For simple-peer: signals waiting to be delivered to each user
    pendingSignals: Map<string, SignalEntry[]>;
    // Store all signals for late joiners
    allSignals: SignalEntry[];
    createdAt: Date;
}

const signalingStore = new Map<string, RoomData>();

// Clean up old sessions every 5 minutes
setInterval(() => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    for (const [roomId, room] of signalingStore.entries()) {
        if (room.createdAt < fiveMinutesAgo) {
            signalingStore.delete(roomId);
        }
    }
}, 5 * 60 * 1000);

function getOrCreateRoom(meetingId: string): RoomData {
    if (!signalingStore.has(meetingId)) {
        signalingStore.set(meetingId, {
            participants: new Map(),
            pendingSignals: new Map(),
            allSignals: [],
            createdAt: new Date()
        });
    }
    return signalingStore.get(meetingId)!;
}

async function verifyMeetingAccess(meetingId: string, oderId: string, userRole: string) {
    await connectDB();
    
    let meeting = await Meeting.findById(meetingId);
    
    // For testing purposes, create a mock meeting if it doesn't exist
    if (!meeting && meetingId === '507f1f77bcf86cd799439011') {
        meeting = {
            _id: meetingId,
            patientId: userRole === 'patient' ? oderId : '507f1f77bcf86cd799439012',
            doctorId: userRole === 'provider' ? oderId : '507f1f77bcf86cd799439013',
            type: 'video',
            status: 'active',
            scheduledFor: new Date(),
            reason: 'Test consultation'
        };
    }
    
    if (!meeting) {
        return { meeting: null, isAuthorized: false };
    }

    const isAuthorized = meeting.patientId.toString() === oderId || 
                       meeting.doctorId.toString() === oderId;
    
    return { meeting, isAuthorized };
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const oderId = session.user.id;
        const { id: meetingId } = await params;
        const { meeting, isAuthorized } = await verifyMeetingAccess(
            meetingId, 
            oderId, 
            session.user.role || 'patient'
        );
        
        if (!meeting) {
            return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
        }
        
        if (!isAuthorized) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        const room = getOrCreateRoom(meetingId);
        const userRole = meeting.patientId.toString() === oderId ? 'patient' : 'provider';
        
        // Add user to room if not already present
        if (!room.participants.has(oderId)) {
            room.participants.set(oderId, {
                oderId: oderId,
                role: userRole,
                iceCandidates: []
            });
            // Initialize pending signals for this user
            room.pendingSignals.set(oderId, []);
            
            // When a user joins, give them any existing signals from others
            const existingSignals = room.allSignals.filter(s => s.oderId !== oderId);
            if (existingSignals.length > 0) {
                room.pendingSignals.set(oderId, [...existingSignals]);
                console.log(`📥 User ${oderId} joining, found ${existingSignals.length} existing signals`);
            }
        }

        // Get pending signals for this user and clear them
        const pendingSignals = room.pendingSignals.get(oderId) || [];
        room.pendingSignals.set(oderId, []);

        // Format signals for simple-peer compatibility
        const signals = pendingSignals.map(s => ({
            oderId: s.oderId,
            signal: s.signal
        }));

        // Return room state
        const participants = Array.from(room.participants.values()).map(p => ({
            oderId: p.oderId,
            role: p.role,
            hasOffer: !!p.offer,
            hasAnswer: !!p.answer,
            iceCandidatesCount: p.iceCandidates.length
        }));

        console.log(`📥 GET /signal for ${oderId} (${userRole}): returning ${signals.length} signals`);

        return NextResponse.json({
            roomId: meetingId,
            participants,
            userRole,
            isReady: participants.length >= 2,
            signals // This is what simple-peer expects!
        });

    } catch (error) {
        console.error('Signaling GET error:', error);
        return NextResponse.json({ error: 'Signaling failed' }, { status: 500 });
    }
}

export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);
        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const oderId = session.user.id;
        const odername = session.user.name || 'Unknown';
        const { id: meetingId } = await params;
        const data = await request.json();
        
        const { meeting, isAuthorized } = await verifyMeetingAccess(
            meetingId, 
            oderId, 
            session.user.role || 'patient'
        );
        
        if (!meeting) {
            return NextResponse.json({ error: 'Meeting not found' }, { status: 404 });
        }
        
        if (!isAuthorized) {
            return NextResponse.json({ error: 'Access denied' }, { status: 403 });
        }

        const room = getOrCreateRoom(meetingId);
        const userRole = meeting.patientId.toString() === oderId ? 'patient' : 'provider';
        
        // Ensure user is in room
        if (!room.participants.has(oderId)) {
            room.participants.set(oderId, {
                oderId: oderId,
                role: userRole,
                iceCandidates: []
            });
            room.pendingSignals.set(oderId, []);
        }

        const participant = room.participants.get(oderId)!;

        console.log(`📤 POST /signal from ${oderId} (${userRole}), type: ${data.type || 'signal'}`);

        // Handle simple-peer signal (has 'signal' property)
        if (data.signal) {
            const signalEntry: SignalEntry = {
                oderId: oderId,
                odername: odername,
                signal: data.signal,
                timestamp: Date.now()
            };
            
            // Store in allSignals for late joiners
            room.allSignals.push(signalEntry);
            
            // Add to pending signals for ALL other participants
            for (const [participantId] of room.participants) {
                if (participantId !== oderId) {
                    if (!room.pendingSignals.has(participantId)) {
                        room.pendingSignals.set(participantId, []);
                    }
                    room.pendingSignals.get(participantId)!.push(signalEntry);
                    console.log(`📨 Queued signal for ${participantId}`);
                }
            }
            
            return NextResponse.json({ success: true });
        }

        // Handle native WebRTC message types
        switch (data.type) {
            case 'offer':
                if (data.offer) {
                    participant.offer = data.offer;
                    console.log(`📤 Stored native WebRTC offer from ${userRole}`);
                }
                break;
            
            case 'answer':
                if (data.answer) {
                    participant.answer = data.answer;
                    console.log(`📤 Stored native WebRTC answer from ${userRole}`);
                }
                break;
            
            case 'ice-candidate':
                if (data.candidate) {
                    participant.iceCandidates.push(data.candidate);
                    console.log(`🧊 Stored ICE candidate from ${userRole}`);
                }
                break;
            
            case 'poll':
                // Return the other participant's native WebRTC signaling data
                const otherPoll = Array.from(room.participants.values())
                    .find(p => p.oderId !== oderId);
                
                const pollResponse: any = { success: true };
                
                if (otherPoll) {
                    if (otherPoll.offer) {
                        pollResponse.offer = otherPoll.offer;
                    }
                    if (otherPoll.answer) {
                        pollResponse.answer = otherPoll.answer;
                    }
                    if (otherPoll.iceCandidates.length > 0) {
                        pollResponse.iceCandidates = [...otherPoll.iceCandidates];
                        otherPoll.iceCandidates = [];
                    }
                }
                
                return NextResponse.json(pollResponse);
            
            case 'get-offer':
                const otherForOffer = Array.from(room.participants.values())
                    .find(p => p.oderId !== oderId);
                return NextResponse.json({ offer: otherForOffer?.offer || null });
            
            case 'get-answer':
                const otherForAnswer = Array.from(room.participants.values())
                    .find(p => p.oderId !== oderId);
                return NextResponse.json({ answer: otherForAnswer?.answer || null });
        }

        // Return any pending data from other participants
        const otherParticipant = Array.from(room.participants.values())
            .find(p => p.oderId !== oderId);

        const response: any = { success: true };

        if (otherParticipant) {
            if (data.type === 'offer' && otherParticipant.answer) {
                response.answer = otherParticipant.answer;
            }
            if (data.type === 'answer' && otherParticipant.offer) {
                response.offer = otherParticipant.offer;
            }
            if (otherParticipant.iceCandidates.length > 0) {
                response.iceCandidates = [...otherParticipant.iceCandidates];
                otherParticipant.iceCandidates = [];
            }
        }

        return NextResponse.json(response);

    } catch (error) {
        console.error('Signaling POST error:', error);
        return NextResponse.json({ error: 'Signaling failed' }, { status: 500 });
    }
}