'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from '@/navigation';
import { useParams } from 'next/navigation';
import Peer from 'simple-peer';
import { 
    Video, VideoOff, Mic, MicOff, Phone, PhoneOff, 
    MessageSquare, Send, Users, ArrowLeft, 
    Loader2, XCircle, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

interface Message {
    senderId: string;
    senderName: string;
    senderRole: string;
    content: string;
    timestamp: Date;
}

interface Meeting {
    _id: string;
    type: 'text' | 'audio' | 'video';
    status: string;
    scheduledFor: string;
    reason: string;
    roomId: string;
    messages: Message[];
    patient: { _id: string; name: string; email: string } | null;
    doctor: { _id: string; name: string; email: string; specialty?: string } | null;
}

export default function MeetingRoomPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const params = useParams();
    const meetingId = params.id as string;

    const [meeting, setMeeting] = useState<Meeting | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Call state
    const [isInCall, setIsInCall] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [remoteConnected, setRemoteConnected] = useState(false);
    
    // Chat state
    const [messages, setMessages] = useState<Message[]>([]);
    const [messageInput, setMessageInput] = useState('');
    const [showChat, setShowChat] = useState(true);
    
    // Media refs
    const localVideoRef = useRef<HTMLVideoElement>(null);
    const remoteVideoRef = useRef<HTMLVideoElement>(null);
    const localStreamRef = useRef<MediaStream | null>(null);
    const peerRef = useRef<Peer.Instance | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);
    const pollingRef = useRef<NodeJS.Timeout | null>(null);
    const isConnectedRef = useRef(false);
    const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connecting' | 'connected' | 'failed'>('idle');

    // Fetch meeting details
    useEffect(() => {
        const fetchMeeting = async () => {
            try {
                const response = await fetch(`/api/meetings/${meetingId}`);
                if (!response.ok) {
                    throw new Error('Meeting not found');
                }
                const data = await response.json();
                setMeeting(data);
                setMessages(data.messages || []);
            } catch (err) {
                setError(err instanceof Error ? err.message : 'Failed to load meeting');
            } finally {
                setLoading(false);
            }
        };

        if (status === 'authenticated' && session) {
            fetchMeeting();
        }
    }, [session, status, meetingId]);

    // Poll for messages
    useEffect(() => {
        if (!meeting || !session) return;

        const pollMessages = async () => {
            try {
                const response = await fetch(`/api/meetings/${meetingId}`);
                if (response.ok) {
                    const data = await response.json();
                    if (data.messages && data.messages.length > messages.length) {
                        setMessages(data.messages);
                    }
                }
            } catch (err) {
                console.error('Error polling messages:', err);
            }
        };

        const interval = setInterval(pollMessages, 3000);
        return () => clearInterval(interval);
    }, [meeting, session, meetingId, messages.length]);

    // Poll for WebRTC signals
    const pollSignals = useCallback(async () => {
        if (!meeting) return;
        
        // Don't process more signals once connected
        if (isConnectedRef.current) {
            return;
        }

        try {
            const response = await fetch(`/api/meetings/${meetingId}/signal`);
            if (response.ok) {
                const data = await response.json();
                
                if (data.signals && data.signals.length > 0) {
                    console.log('📥 Poll signals response:', data.signals.length, 'signals');
                }
                
                if (data.signals && data.signals.length > 0) {
                    for (const sig of data.signals) {
                        if (sig.signal) {
                            const sigType = sig.signal.type || 'unknown';
                            console.log('📥 Received signal:', sigType);
                            
                            // Skip if we're already connected
                            if (isConnectedRef.current) {
                                console.log('⏭️ Skipping signal - already connected');
                                continue;
                            }
                            
                            if (peerRef.current && !peerRef.current.destroyed) {
                                // Existing peer - apply signal (for answer signals)
                                // But skip if it's an offer and we already have a peer
                                if (sigType === 'offer' && peerRef.current) {
                                    console.log('⏭️ Skipping offer - already have a peer');
                                    continue;
                                }
                                
                                try {
                                    console.log('📥 Applying signal to existing peer');
                                    peerRef.current.signal(sig.signal);
                                } catch (e: any) {
                                    // Ignore "cannot signal after peer is destroyed" errors
                                    if (!e.message?.includes('destroyed')) {
                                        console.error('Error applying signal:', e);
                                    }
                                }
                            } else if (localStreamRef.current && !peerRef.current) {
                                // No peer yet - this is an incoming call, create answer peer
                                console.log('📥 Creating answer peer for incoming signal');
                                const peer = new Peer({
                                    initiator: false,
                                    trickle: false,
                                    stream: localStreamRef.current,
                                    config: {
                                        iceServers: [
                                            { urls: 'stun:stun.l.google.com:19302' },
                                            { urls: 'stun:stun1.l.google.com:19302' },
                                            { urls: 'stun:stun2.l.google.com:19302' },
                                            { urls: 'stun:stun3.l.google.com:19302' }
                                        ]
                                    }
                                });

                                peer.on('signal', async (answerData) => {
                                    console.log('📤 Sending answer signal');
                                    try {
                                        await fetch(`/api/meetings/${meetingId}/signal`, {
                                            method: 'POST',
                                            headers: { 'Content-Type': 'application/json' },
                                            body: JSON.stringify({
                                                type: 'answer',
                                                signal: answerData,
                                            }),
                                        });
                                    } catch (err) {
                                        console.error('Error sending answer signal:', err);
                                    }
                                });

                                peer.on('stream', (stream) => {
                                    console.log('🎥 Received remote stream!');
                                    if (remoteVideoRef.current) {
                                        remoteVideoRef.current.srcObject = stream;
                                    }
                                    setRemoteConnected(true);
                                    isConnectedRef.current = true;
                                    setConnectionStatus('connected');
                                    // Notify server we're connected
                                    fetch(`/api/meetings/${meetingId}/signal`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ type: 'connected' }),
                                    }).catch(() => {});
                                });

                                peer.on('connect', () => {
                                    console.log('✅ Peer connected!');
                                    isConnectedRef.current = true;
                                    setConnectionStatus('connected');
                                    // Notify server we're connected
                                    fetch(`/api/meetings/${meetingId}/signal`, {
                                        method: 'POST',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ type: 'connected' }),
                                    }).catch(() => {});
                                });

                                peer.on('error', (err) => {
                                    console.error('Peer error:', err);
                                    setConnectionStatus('failed');
                                });

                                peer.on('close', () => {
                                    console.log('🔌 Peer connection closed');
                                    setRemoteConnected(false);
                                    isConnectedRef.current = false;
                                });

                                // Apply the incoming signal
                                peer.signal(sig.signal);
                                peerRef.current = peer;
                                setIsInCall(true);
                            } else {
                                console.log('⚠️ Received signal but no local stream ready');
                            }
                        }
                    }
                }
            }
        } catch (err) {
            console.error('Error polling signals:', err);
        }
    }, [meeting, meetingId]);

    // Start signal polling when in call or when meeting is loaded (to receive incoming calls)
    useEffect(() => {
        // Stop polling when connected
        if (isConnectedRef.current || connectionStatus === 'connected') {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
                console.log('🛑 Stopped polling - connection established');
            }
            return;
        }
        
        if (meeting && isInCall) {
            // Poll immediately
            pollSignals();
            // Then continue polling
            pollingRef.current = setInterval(pollSignals, 1000); // Poll faster - every 1 second
        }
        return () => {
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
            }
        };
    }, [isInCall, meeting, pollSignals, connectionStatus]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            // Stop polling first
            if (pollingRef.current) {
                clearInterval(pollingRef.current);
                pollingRef.current = null;
            }
            // Then stop media tracks
            if (localStreamRef.current) {
                localStreamRef.current.getTracks().forEach(track => track.stop());
                localStreamRef.current = null;
            }
            // Finally destroy peer
            if (peerRef.current && !peerRef.current.destroyed) {
                peerRef.current.destroy();
                peerRef.current = null;
            }
        };
    }, []);

    // Auto-scroll chat
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [messages]);

    const initiateCall = useCallback(() => {
        if (!localStreamRef.current || !meeting) return;

        console.log('📞 Initiating call as initiator...');
        
        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream: localStreamRef.current,
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' },
                    { urls: 'stun:stun2.l.google.com:19302' },
                    { urls: 'stun:stun3.l.google.com:19302' }
                ]
            }
        });

        peer.on('signal', async (data) => {
            console.log('📤 Sending offer signal');
            // Send signal via HTTP instead of socket
            try {
                await fetch(`/api/meetings/${meetingId}/signal`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'offer',
                        signal: data,
                    }),
                });
                setConnectionStatus('connecting');
            } catch (err) {
                console.error('Error sending signal:', err);
            }
        });

        peer.on('stream', (stream) => {
            console.log('🎥 Received remote stream!');
            if (remoteVideoRef.current) {
                remoteVideoRef.current.srcObject = stream;
            }
            setRemoteConnected(true);
            isConnectedRef.current = true;
            setConnectionStatus('connected');
            // Notify server we're connected
            fetch(`/api/meetings/${meetingId}/signal`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'connected' }),
            }).catch(() => {});
        });

        peer.on('connect', () => {
            console.log('✅ Peer connected!');
            isConnectedRef.current = true;
            setConnectionStatus('connected');
            // Notify server we're connected
            fetch(`/api/meetings/${meetingId}/signal`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'connected' }),
            }).catch(() => {});
        });

        peer.on('error', (err) => {
            console.error('Peer error:', err);
            setConnectionStatus('failed');
        });

        peer.on('close', () => {
            console.log('🔌 Peer connection closed');
            setRemoteConnected(false);
            isConnectedRef.current = false;
        });

        peerRef.current = peer;
    }, [meeting, meetingId]);

    const startCall = async () => {
        try {
            const constraints = {
                audio: true,
                video: meeting?.type === 'video',
            };

            console.log('📞 Starting call, getting user media...');
            const stream = await navigator.mediaDevices.getUserMedia(constraints);
            localStreamRef.current = stream;

            if (localVideoRef.current && meeting?.type === 'video') {
                localVideoRef.current.srcObject = stream;
            }

            setIsInCall(true);

            // Update meeting status to active
            await fetch(`/api/meetings/${meetingId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'active' }),
            });

            // First check if anyone else is already in the room
            console.log('📥 Checking room status...');
            const signalResponse = await fetch(`/api/meetings/${meetingId}/signal`);
            const signalData = await signalResponse.json();
            
            console.log('📥 Room status:', {
                participants: signalData.participants?.length || 0,
                signals: signalData.signals?.length || 0,
                isReady: signalData.isReady,
                myRole: signalData.userRole
            });
            
            // Check if there's a fresh offer signal (from another user who just joined)
            const hasFreshOffer = signalData.signals?.some((s: any) => s.signal?.type === 'offer');
            
            if (hasFreshOffer) {
                // Someone already sent an offer, we should answer
                console.log('📥 Found offer signal, will answer instead of initiating');
                await pollSignals();
            } else {
                // Determine who should initiate based on role
                // Provider (doctor) always initiates, patient always answers
                const shouldInitiate = signalData.userRole === 'provider';
                
                if (shouldInitiate) {
                    console.log('📤 Initiating call as provider...');
                    initiateCall();
                } else {
                    console.log('⏳ Waiting for provider to initiate (I am patient)...');
                    // Just start polling - the provider will send an offer
                }
            }
        } catch (err) {
            console.error('Error starting call:', err);
            setError('Failed to access camera/microphone');
        }
    };

    const endCall = async () => {
        // Stop polling first
        if (pollingRef.current) {
            clearInterval(pollingRef.current);
            pollingRef.current = null;
        }
        
        // Stop media tracks
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(track => track.stop());
            localStreamRef.current = null;
        }
        
        // Destroy peer if not already destroyed
        if (peerRef.current && !peerRef.current.destroyed) {
            peerRef.current.destroy();
            peerRef.current = null;
        }
        
        setIsInCall(false);
        setRemoteConnected(false);
        setConnectionStatus('idle');
        isConnectedRef.current = false;

        // Update meeting status
        await fetch(`/api/meetings/${meetingId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: 'ended' }),
        });

        router.push('/meetings');
    };

    const toggleMute = () => {
        if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) {
                audioTrack.enabled = !audioTrack.enabled;
                setIsMuted(!audioTrack.enabled);
            }
        }
    };

    const toggleVideo = () => {
        if (localStreamRef.current) {
            const videoTrack = localStreamRef.current.getVideoTracks()[0];
            if (videoTrack) {
                videoTrack.enabled = !videoTrack.enabled;
                setIsVideoOff(!videoTrack.enabled);
            }
        }
    };

    const sendMessage = async () => {
        if (!messageInput.trim() || !meeting) return;

        const newMessage: Message = {
            senderId: session?.user?.id || '',
            senderName: session?.user?.name || 'Unknown',
            senderRole: session?.user?.role || 'patient',
            content: messageInput,
            timestamp: new Date(),
        };

        // Optimistically add message to UI
        setMessages(prev => [...prev, newMessage]);

        // Save message to database
        await fetch(`/api/meetings/${meetingId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: messageInput }),
        });

        setMessageInput('');
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
            </div>
        );
    }

    if (error || !meeting) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Card className="bg-slate-900/50 border-slate-700 max-w-md">
                    <CardContent className="py-12 text-center">
                        <XCircle className="h-12 w-12 mx-auto text-red-500 mb-4" />
                        <h3 className="text-xl font-medium text-white mb-2">Meeting Not Found</h3>
                        <p className="text-slate-400 mb-6">{error || 'This meeting does not exist or you do not have access.'}</p>
                        <Button onClick={() => router.push('/meetings')} variant="outline">
                            <ArrowLeft className="h-4 w-4 mr-2" /> Back to Meetings
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const isPatient = session?.user?.role === 'patient';
    const otherParty = isPatient ? meeting.doctor : meeting.patient;

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950/30 to-slate-900" />

            <div className="relative z-10 h-screen flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800">
                    <div className="flex items-center gap-4">
                        <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => router.push('/meetings')}
                            className="text-slate-400 hover:text-white"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div>
                            <h1 className="font-medium text-white">
                                {meeting.type.charAt(0).toUpperCase() + meeting.type.slice(1)} Consultation
                            </h1>
                            <p className="text-sm text-slate-400">with {otherParty?.name || 'Unknown'}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm ${
                            isInCall ? 'bg-green-500/20 text-green-400' : 'bg-slate-700 text-slate-400'
                        }`}>
                            <span className={`w-2 h-2 rounded-full ${isInCall ? 'bg-green-400 animate-pulse' : 'bg-slate-500'}`} />
                            {isInCall ? 'In Call' : 'Not Connected'}
                        </div>
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex overflow-hidden">
                    {/* Video/Audio Section */}
                    {(meeting.type === 'video' || meeting.type === 'audio') && (
                        <div className="flex-1 flex flex-col p-4">
                            {/* Video Container */}
                            {meeting.type === 'video' ? (
                                <div className="flex-1 grid grid-cols-2 gap-4">
                                    {/* Remote Video */}
                                    <div className="relative bg-slate-800 rounded-2xl overflow-hidden">
                                        <video
                                            ref={remoteVideoRef}
                                            autoPlay
                                            playsInline
                                            className="w-full h-full object-cover"
                                        />
                                        {!remoteConnected && (
                                            <div className="absolute inset-0 flex items-center justify-center">
                                                <div className="text-center">
                                                    <Users className="h-16 w-16 mx-auto text-slate-600 mb-4" />
                                                    <p className="text-slate-400">Waiting for {otherParty?.name || 'other party'}...</p>
                                                </div>
                                            </div>
                                        )}
                                        {remoteConnected && (
                                            <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded-full text-sm">
                                                {otherParty?.name}
                                            </div>
                                        )}
                                    </div>

                                    {/* Local Video */}
                                    <div className="relative bg-slate-800 rounded-2xl overflow-hidden">
                                        <video
                                            ref={localVideoRef}
                                            autoPlay
                                            muted
                                            playsInline
                                            className={`w-full h-full object-cover ${isVideoOff ? 'hidden' : ''}`}
                                        />
                                        {isVideoOff && (
                                            <div className="absolute inset-0 flex items-center justify-center bg-slate-700">
                                                <VideoOff className="h-16 w-16 text-slate-500" />
                                            </div>
                                        )}
                                        <div className="absolute bottom-4 left-4 bg-black/50 px-3 py-1 rounded-full text-sm">
                                            You
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                /* Audio Only View */
                                <div className="flex-1 flex items-center justify-center">
                                    <div className="text-center">
                                        <div className={`w-32 h-32 rounded-full mx-auto mb-6 flex items-center justify-center ${
                                            isInCall ? 'bg-gradient-to-br from-cyan-500 to-violet-500 animate-pulse' : 'bg-slate-700'
                                        }`}>
                                            <Phone className="h-16 w-16 text-white" />
                                        </div>
                                        <h2 className="text-2xl font-medium text-white mb-2">
                                            {isInCall ? 'Call in Progress' : 'Audio Consultation'}
                                        </h2>
                                        <p className="text-slate-400">
                                            {remoteConnected 
                                                ? `Connected with ${otherParty?.name}`
                                                : `Waiting for ${otherParty?.name}...`
                                            }
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Call Controls */}
                            <div className="flex items-center justify-center gap-4 py-6">
                                {!isInCall ? (
                                    <Button
                                        onClick={startCall}
                                        className="bg-green-600 hover:bg-green-700 rounded-full px-8 py-6"
                                    >
                                        <Phone className="h-6 w-6 mr-2" />
                                        Start {meeting.type === 'video' ? 'Video' : 'Audio'} Call
                                    </Button>
                                ) : (
                                    <>
                                        <button
                                            onClick={toggleMute}
                                            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                                                isMuted ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-700 hover:bg-slate-600'
                                            }`}
                                        >
                                            {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
                                        </button>

                                        {meeting.type === 'video' && (
                                            <button
                                                onClick={toggleVideo}
                                                className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                                                    isVideoOff ? 'bg-red-600 hover:bg-red-700' : 'bg-slate-700 hover:bg-slate-600'
                                                }`}
                                            >
                                                {isVideoOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
                                            </button>
                                        )}

                                        <button
                                            onClick={endCall}
                                            className="w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 flex items-center justify-center"
                                        >
                                            <PhoneOff className="h-6 w-6" />
                                        </button>

                                        <button
                                            onClick={() => setShowChat(!showChat)}
                                            className={`w-14 h-14 rounded-full flex items-center justify-center transition-all ${
                                                showChat ? 'bg-cyan-600 hover:bg-cyan-700' : 'bg-slate-700 hover:bg-slate-600'
                                            }`}
                                        >
                                            <MessageSquare className="h-6 w-6" />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Chat Section */}
                    {(meeting.type === 'text' || showChat) && (
                        <div className={`${meeting.type === 'text' ? 'flex-1' : 'w-96'} flex flex-col border-l border-slate-800`}>
                            <div className="px-4 py-3 border-b border-slate-800">
                                <h2 className="font-medium text-white flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4 text-cyan-400" />
                                    Chat
                                </h2>
                            </div>

                            {/* Messages */}
                            <div 
                                ref={chatContainerRef}
                                className="flex-1 overflow-y-auto p-4 space-y-4"
                            >
                                {messages.length === 0 ? (
                                    <div className="text-center text-slate-500 py-8">
                                        <MessageSquare className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p>No messages yet. Start the conversation!</p>
                                    </div>
                                ) : (
                                    messages.map((msg, index) => {
                                        const isOwn = msg.senderId === session?.user?.id;
                                        return (
                                            <div
                                                key={index}
                                                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div className={`max-w-[80%] rounded-2xl px-4 py-2 ${
                                                    isOwn 
                                                        ? 'bg-gradient-to-r from-cyan-600 to-violet-600 text-white'
                                                        : 'bg-slate-800 text-white'
                                                }`}>
                                                    {!isOwn && (
                                                        <p className="text-xs text-slate-400 mb-1">{msg.senderName}</p>
                                                    )}
                                                    <p>{msg.content}</p>
                                                    <p className={`text-xs mt-1 ${isOwn ? 'text-white/70' : 'text-slate-500'}`}>
                                                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {/* Message Input */}
                            <div className="p-4 border-t border-slate-800">
                                <div className="flex gap-2">
                                    <Input
                                        value={messageInput}
                                        onChange={(e) => setMessageInput(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                                        placeholder="Type a message..."
                                        className="flex-1 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                                    />
                                    <Button 
                                        onClick={sendMessage}
                                        className="bg-gradient-to-r from-cyan-500 to-violet-500"
                                    >
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
