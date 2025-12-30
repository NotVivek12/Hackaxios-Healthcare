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

interface Participant {
    oderId: string;
    role: string;
    // For native WebRTC
    offer?: RTCSessionDescriptionInit;
    answer?: RTCSessionDescriptionInit;
    iceCandidates: RTCIceCandidateInit[];
    // Track if this participant has received an offer/answer
    hasReceivedOffer?: boolean;
    hasReceivedAnswer?: boolean;
}

interface RoomData {
    participants: Map<string, Participant>;
    // For simple-peer: signals waiting to be delivered to each user
    pendingSignals: Map<string, SignalEntry[]>;
    createdAt: Date;
}

const signalingStore = new Map<string, RoomData>();

// Clean up old sessions every 2 minutes
setInterval(() => {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);
    for (const [roomId, room] of signalingStore.entries()) {
        if (room.createdAt < twoMinutesAgo) {
            signalingStore.delete(roomId);
            console.log(`🗑️ Cleaned up stale room ${roomId}`);
        }
    }
}, 60 * 1000);

function getOrCreateRoom(meetingId: string): RoomData {
    if (!signalingStore.has(meetingId)) {
        signalingStore.set(meetingId, {
            participants: new Map(),
            pendingSignals: new Map(),
            createdAt: new Date()
        });
    }
    return signalingStore.get(meetingId)!;
}

// Clear room signals when a new call is started (except for the caller's)
function resetRoomSignals(meetingId: string, callerId: string) {
    const room = signalingStore.get(meetingId);
    if (room) {
        room.pendingSignals.clear();
        // Reset participant states
        for (const [, participant] of room.participants) {
            participant.hasReceivedOffer = false;
            participant.hasReceivedAnswer = false;
            participant.offer = undefined;
            participant.answer = undefined;
            participant.iceCandidates = [];
        }
        console.log(`🔄 Reset signals for room ${meetingId} (new call from ${callerId})`);
    }
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
                iceCandidates: [],
                hasReceivedOffer: false,
                hasReceivedAnswer: false
            });
            // Initialize pending signals for this user
            room.pendingSignals.set(oderId, []);
        }

        const participant = room.participants.get(oderId)!;
        
        // Get pending signals for this user and clear them
        const pendingSignals = room.pendingSignals.get(oderId) || [];
        room.pendingSignals.set(oderId, []);

        // Filter out stale signals (older than 30 seconds) and already received signals
        const now = Date.now();
        const filteredSignals = pendingSignals.filter(s => {
            // Filter out stale signals
            if (now - s.timestamp > 30000) {
                console.log(`⏳ Filtering out stale signal (${Math.round((now - s.timestamp) / 1000)}s old)`);
                return false;
            }
            
            const sigType = s.signal?.type;
            if (sigType === 'offer' && participant.hasReceivedOffer) {
                return false; // Already received an offer
            }
            if (sigType === 'answer' && participant.hasReceivedAnswer) {
                return false; // Already received an answer
            }
            return true;
        });
        
        // Mark as received
        filteredSignals.forEach(s => {
            if (s.signal?.type === 'offer') participant.hasReceivedOffer = true;
            if (s.signal?.type === 'answer') participant.hasReceivedAnswer = true;
        });

        // Format signals for simple-peer compatibility
        const signals = filteredSignals.map(s => ({
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

        if (signals.length > 0) {
            console.log(`📥 GET /signal for ${oderId} (${userRole}): returning ${signals.length} signals`);
        }

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
                iceCandidates: [],
                hasReceivedOffer: false,
                hasReceivedAnswer: false
            });
            room.pendingSignals.set(oderId, []);
        }

        const participant = room.participants.get(oderId)!;

        console.log(`📤 POST /signal from ${oderId} (${userRole}), type: ${data.type || (data.signal?.type || 'signal')}`);

        // Handle simple-peer signal (has 'signal' property)
        if (data.signal) {
            const signalType = data.signal.type;
            
            // If this is a new offer, reset the room signals (new call starting)
            if (signalType === 'offer') {
                resetRoomSignals(meetingId, oderId);
                console.log(`🔄 New offer detected, reset signals for room ${meetingId}`);
            }
            
            const signalEntry: SignalEntry = {
                oderId: oderId,
                odername: odername,
                signal: data.signal,
                timestamp: Date.now()
            };
            
            // Add to pending signals for ALL other participants (NO allSignals accumulation)
            for (const [participantId, p] of room.participants) {
                if (participantId !== oderId) {
                    // Skip if recipient already received this type
                    if (signalType === 'offer' && p.hasReceivedOffer) {
                        console.log(`⏭️ Skipping offer for ${participantId} - already received`);
                        continue;
                    }
                    if (signalType === 'answer' && p.hasReceivedAnswer) {
                        console.log(`⏭️ Skipping answer for ${participantId} - already received`);
                        continue;
                    }
                    
                    if (!room.pendingSignals.has(participantId)) {
                        room.pendingSignals.set(participantId, []);
                    }
                    room.pendingSignals.get(participantId)!.push(signalEntry);
                    console.log(`📨 Queued ${signalType || 'signal'} for ${participantId}`);
                }
            }
            
            return NextResponse.json({ success: true });
        }

        // Handle 'connected' signal - marks that this user is connected
        if (data.type === 'connected') {
            console.log(`✅ User ${oderId} reported connected, clearing pending signals`);
            room.pendingSignals.set(oderId, []);
            // Mark both as having received everything
            participant.hasReceivedOffer = true;
            participant.hasReceivedAnswer = true;
            return NextResponse.json({ success: true });
        }

        // Handle 'reset' signal - clears the room for a fresh call
        if (data.type === 'reset') {
            console.log(`🔄 User ${oderId} requested room reset`);
            // Delete the entire room to start fresh
            signalingStore.delete(meetingId);
            return NextResponse.json({ success: true, reset: true });
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