'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { FadeIn, ScaleIn } from '@/components/animations/motion-effects';

interface EnhancedVideoCallProps {
    consultationId: string;
    userId: string;
    userName: string;
    isProvider: boolean;
    onStartConsultation: () => void;
    onEndConsultation: () => void;
    consultationStarted: boolean;
    consultationStatus: string;
}

export const EnhancedVideoCall = ({
    consultationId,
    userId,
    userName,
    isProvider,
    onStartConsultation,
    onEndConsultation,
    consultationStarted,
    consultationStatus
}: EnhancedVideoCallProps) => {
    // Debug logging
    console.log('🔍 EnhancedVideoCall Props:', { 
        consultationId, 
        userId, 
        userName, 
        isProvider, 
        consultationStarted, 
        consultationStatus 
    });
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const [connectionQuality, setConnectionQuality] = useState<'excellent' | 'good' | 'poor'>('excellent');
    const [recordingActive, setRecordingActive] = useState(false);
    const [participantConnected, setParticipantConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [connectionState, setConnectionState] = useState<'connecting' | 'connected' | 'disconnected'>('disconnected');

    const localVideo = useRef<HTMLVideoElement>(null);
    const remoteVideo = useRef<HTMLVideoElement>(null);
    const peerConnection = useRef<RTCPeerConnection | null>(null);
    const signalingInterval = useRef<NodeJS.Timeout | null>(null);
    const hasCreatedAnswer = useRef<boolean>(false);

    // WebRTC Configuration with multiple STUN servers for better connectivity
    const rtcConfig: RTCConfiguration = {
        iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
            { urls: 'stun:stun2.l.google.com:19302' },
            { urls: 'stun:stun3.l.google.com:19302' },
            { urls: 'stun:stun4.l.google.com:19302' },
            { urls: 'stun:stun.stunprotocol.org:3478' }
        ],
        iceCandidatePoolSize: 10,
        bundlePolicy: 'max-bundle',
        rtcpMuxPolicy: 'require'
    };

    // Initialize local media stream
    const initializeMedia = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    width: { ideal: 1280 }, 
                    height: { ideal: 720 },
                    frameRate: { ideal: 30 }
                },
                audio: { 
                    echoCancellation: true, 
                    noiseSuppression: true,
                    autoGainControl: true
                }
            });

            setLocalStream(stream);
            if (localVideo.current) {
                localVideo.current.srcObject = stream;
            }

            return stream;
        } catch (err) {
            console.error('Error accessing media devices:', err);
            setError('Could not access camera or microphone. Please check your permissions.');
            throw err;
        }
    }, []);

    // Create peer connection
    const createPeerConnection = useCallback((stream: MediaStream) => {
        console.log('🔗 Creating peer connection...');
        const pc = new RTCPeerConnection(rtcConfig);

        // Add local stream tracks
        stream.getTracks().forEach(track => {
            console.log(`➕ Adding ${track.kind} track to peer connection`);
            pc.addTrack(track, stream);
        });

        // Handle remote stream
        pc.ontrack = (event) => {
            console.log('🎥 Received remote track:', event.track.kind);
            const [remoteStream] = event.streams;
            console.log('🎥 Setting remote stream with tracks:', remoteStream.getTracks().length);
            setRemoteStream(remoteStream);
            if (remoteVideo.current) {
                remoteVideo.current.srcObject = remoteStream;
                console.log('🎥 Remote video element updated');
            }
            setParticipantConnected(true);
        };

        // Handle ICE candidates
        pc.onicecandidate = async (event) => {
            if (event.candidate) {
                console.log('🧊 Sending ICE candidate:', event.candidate.type);
                try {
                    await fetch(`/api/meetings/${consultationId}/signal`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            type: 'ice-candidate',
                            candidate: event.candidate.toJSON()
                        })
                    });
                } catch (err) {
                    console.error('❌ Error sending ICE candidate:', err);
                }
            } else {
                console.log('🧊 ICE gathering complete');
            }
        };

        // Handle connection state changes
        pc.onconnectionstatechange = () => {
            console.log('🔗 Connection state changed:', pc.connectionState);
            setConnectionState(pc.connectionState as any);
            
            switch (pc.connectionState) {
                case 'connected':
                    console.log('✅ Peer connection established!');
                    setConnectionQuality('excellent');
                    setParticipantConnected(true);
                    break;
                case 'connecting':
                    console.log('🔄 Connecting to peer...');
                    setConnectionQuality('good');
                    break;
                case 'disconnected':
                case 'failed':
                    console.log('❌ Peer connection failed/disconnected');
                    setConnectionQuality('poor');
                    setParticipantConnected(false);
                    break;
            }
        };

        // Handle ICE connection state
        pc.oniceconnectionstatechange = () => {
            console.log('🧊 ICE connection state:', pc.iceConnectionState);
        };

        // Handle signaling state
        pc.onsignalingstatechange = () => {
            console.log('📡 Signaling state:', pc.signalingState);
        };

        return pc;
    }, [consultationId]);

    // Start signaling process
    const startSignaling = useCallback(async () => {
        if (!localStream || !consultationStarted) return;

        try {
            setConnectionState('connecting');
            
            // Create peer connection for both provider and patient
            const pc = createPeerConnection(localStream);
            peerConnection.current = pc;

            // Check if we should create offer (doctor initiates)
            if (isProvider) {
                console.log('👨‍⚕️ Doctor creating offer...');
                const offer = await pc.createOffer({
                    offerToReceiveAudio: true,
                    offerToReceiveVideo: true
                });
                
                console.log('📤 Setting local description (offer)');
                await pc.setLocalDescription(offer);

                console.log('📤 Sending offer to signaling server');
                const response = await fetch(`/api/meetings/${consultationId}/signal`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        type: 'offer',
                        offer: offer
                    })
                });

                const data = await response.json();
                console.log('📤 Offer sent, response:', data);
                
                if (data.answer) {
                    console.log('📥 Received immediate answer');
                    await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
                }
            } else {
                console.log('🧑‍🦱 Patient peer connection ready, waiting for offer from doctor...');
            }

            // Start polling for signaling messages
            startSignalingPolling();

        } catch (err) {
            console.error('Error starting signaling:', err);
            setError('Failed to establish connection');
        }
    }, [localStream, consultationStarted, isProvider, consultationId, createPeerConnection]);

    // Poll for signaling messages
    const startSignalingPolling = useCallback(() => {
        if (signalingInterval.current) {
            clearInterval(signalingInterval.current);
        }

        signalingInterval.current = setInterval(async () => {
            try {
                // First, get current state including ICE candidates
                const response = await fetch(`/api/meetings/${consultationId}/signal`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ type: 'poll' })
                });
                const data = await response.json();

                if (!peerConnection.current) {
                    console.log('⏳ Peer connection not ready yet, waiting...');
                    return;
                }

                console.log('🔄 Signaling poll response:', data, 'signalingState:', peerConnection.current.signalingState);

                // Handle incoming offer (patient receives) - only if we haven't processed an offer yet
                if (!isProvider && data.offer && !hasCreatedAnswer.current && peerConnection.current.signalingState === 'stable') {
                    console.log('📥 Patient receiving offer from doctor');
                    hasCreatedAnswer.current = true; // Prevent duplicate answer creation
                    try {
                        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.offer));
                        
                        console.log('📤 Creating answer');
                        const answer = await peerConnection.current.createAnswer();
                        await peerConnection.current.setLocalDescription(answer);
                        
                        // Send answer back
                        await fetch(`/api/meetings/${consultationId}/signal`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({
                                type: 'answer',
                                answer: answer
                            })
                        });
                        console.log('📤 Answer sent');
                    } catch (err) {
                        console.error('❌ Error handling offer:', err);
                        hasCreatedAnswer.current = false; // Reset on error to allow retry
                    }
                }

                // Handle incoming answer (doctor receives)
                if (isProvider && data.answer && peerConnection.current.signalingState === 'have-local-offer') {
                    console.log('📥 Doctor receiving answer from patient');
                    try {
                        await peerConnection.current.setRemoteDescription(new RTCSessionDescription(data.answer));
                        console.log('✅ Remote description set successfully');
                    } catch (err) {
                        console.error('❌ Error setting remote description:', err);
                    }
                }

                // Handle ICE candidates - only add after remote description is set
                if (data.iceCandidates && data.iceCandidates.length > 0 && peerConnection.current.remoteDescription) {
                    console.log(`🧊 Adding ${data.iceCandidates.length} ICE candidates`);
                    for (const candidate of data.iceCandidates) {
                        try {
                            if (candidate) {
                                await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
                            }
                        } catch (err) {
                            console.error('❌ Error adding ICE candidate:', err);
                        }
                    }
                }

            } catch (err) {
                console.error('❌ Signaling polling error:', err);
            }
        }, 1000); // Poll every 1 second for faster connection
    }, [consultationId, isProvider]);

    // Initialize everything when consultation starts
    useEffect(() => {
        console.log('🎥 Video Call Effect - consultationStarted:', consultationStarted, 'localStream:', !!localStream);
        if (consultationStarted && !localStream) {
            console.log('🎥 Initializing media and signaling...');
            // Reset the answer flag when starting fresh
            hasCreatedAnswer.current = false;
            initializeMedia().then(stream => {
                console.log('🎥 Media initialized, starting signaling in 1 second...');
                setTimeout(() => {
                    startSignaling().catch(err => {
                        console.error('❌ Signaling failed, retrying in 3 seconds...', err);
                        setTimeout(() => startSignaling(), 3000);
                    });
                }, 1000);
            }).catch(err => {
                console.error('🎥 Failed to initialize media:', err);
            });
        }

        return () => {
            if (signalingInterval.current) {
                clearInterval(signalingInterval.current);
            }
        };
    }, [consultationStarted, localStream, initializeMedia, startSignaling]);

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            hasCreatedAnswer.current = false;
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
            if (peerConnection.current) {
                peerConnection.current.close();
            }
            if (signalingInterval.current) {
                clearInterval(signalingInterval.current);
            }
        };
    }, [localStream]);

    const toggleMute = () => {
        if (localStream) {
            localStream.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (localStream) {
            localStream.getVideoTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsVideoOff(!isVideoOff);
        }
    };

    const startScreenShare = async () => {
        try {
            const screenStream = await navigator.mediaDevices.getDisplayMedia({
                video: true,
                audio: true
            });
            
            if (localVideo.current) {
                localVideo.current.srcObject = screenStream;
            }

            // Replace video track in peer connection
            if (peerConnection.current && localStream) {
                const videoTrack = screenStream.getVideoTracks()[0];
                const sender = peerConnection.current.getSenders().find(s => 
                    s.track && s.track.kind === 'video'
                );
                if (sender) {
                    await sender.replaceTrack(videoTrack);
                }
            }

            setIsScreenSharing(true);

            screenStream.getVideoTracks()[0].onended = () => {
                setIsScreenSharing(false);
                if (localVideo.current && localStream) {
                    localVideo.current.srcObject = localStream;
                    // Restore original video track
                    if (peerConnection.current) {
                        const videoTrack = localStream.getVideoTracks()[0];
                        const sender = peerConnection.current.getSenders().find(s => 
                            s.track && s.track.kind === 'video'
                        );
                        if (sender && videoTrack) {
                            sender.replaceTrack(videoTrack);
                        }
                    }
                }
            };
        } catch (err) {
            console.error('Error starting screen share:', err);
        }
    };

    const stopScreenShare = () => {
        setIsScreenSharing(false);
        if (localVideo.current && localStream) {
            localVideo.current.srcObject = localStream;
            // Restore original video track
            if (peerConnection.current) {
                const videoTrack = localStream.getVideoTracks()[0];
                const sender = peerConnection.current.getSenders().find(s => 
                    s.track && s.track.kind === 'video'
                );
                if (sender && videoTrack) {
                    sender.replaceTrack(videoTrack);
                }
            }
        }
    };

    const toggleRecording = () => {
        setRecordingActive(!recordingActive);
    };

    if (error) {
        return (
            <div className="h-full flex items-center justify-center bg-red-50 rounded-xl m-4">
                <div className="text-center">
                    <div className="text-6xl mb-4">🚫</div>
                    <p className="text-red-600 mb-4 font-medium">{error}</p>
                    <Button onClick={() => window.location.reload()}>
                        Try Again
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div
            className="h-full flex flex-col p-4 space-y-4"
            data-consultation-id={consultationId}
            data-user-id={userId}
        >
            {/* Main Video Area */}
            <div className="flex-1 relative bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 rounded-2xl overflow-hidden shadow-2xl">
                {/* Remote Video (Main) */}
                <div className="absolute inset-0">
                    {participantConnected && remoteStream ? (
                        <FadeIn>
                            <video
                                ref={remoteVideo}
                                autoPlay
                                playsInline
                                muted={false}
                                className="w-full h-full object-cover"
                            />
                        </FadeIn>
                    ) : (
                        <div className="h-full flex items-center justify-center">
                            {consultationStarted ? (
                                <div className="text-center text-white">
                                    <div className="animate-spin w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                                    <p className="text-xl font-medium">
                                        {connectionState === 'connecting' ? 'Connecting...' : 'Waiting for participant...'}
                                    </p>
                                    <p className="text-gray-300">
                                        Waiting for {isProvider ? 'patient' : 'doctor'} to join
                                    </p>
                                    <p className="text-xs text-gray-400 mt-2">
                                        You are: {userName} ({isProvider ? 'Provider' : 'Patient'})
                                    </p>
                                </div>
                            ) : (
                                <ScaleIn>
                                    <div className="text-center text-white">
                                        <div className="w-24 h-24 bg-gradient-to-r from-blue-500 to-green-500 rounded-full mx-auto mb-6 flex items-center justify-center">
                                            <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                        <h2 className="text-2xl font-bold mb-2">Ready to Start</h2>
                                        <p className="text-gray-300 mb-2">Click the button below to begin your consultation</p>
                                        <p className="text-xs text-blue-300 mb-6">🔄 WebRTC Video Calling v2.0 - Real P2P Connection</p>
                                        <Button 
                                            onClick={onStartConsultation}
                                            className="bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 px-8 py-3 text-lg font-semibold"
                                        >
                                            🎥 Start Consultation
                                        </Button>
                                    </div>
                                </ScaleIn>
                            )}
                        </div>
                    )}
                </div>

                {/* Local Video (Picture-in-Picture) */}
                {localStream && (
                    <div className="absolute bottom-4 right-4 w-48 h-36 bg-black rounded-xl overflow-hidden border-2 border-white shadow-lg z-10">
                        <video
                            ref={localVideo}
                            muted
                            autoPlay
                            playsInline
                            className="w-full h-full object-cover"
                        />
                        {isVideoOff && (
                            <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                                <div className="text-white text-center">
                                    <div className="w-8 h-8 bg-gray-600 rounded-full mx-auto mb-2 flex items-center justify-center">
                                        {userName.charAt(0).toUpperCase()}
                                    </div>
                                    <p className="text-xs">Camera Off</p>
                                </div>
                            </div>
                        )}
                    </div>
                )}

                {/* Connection Quality Indicator */}
                <div className="absolute top-4 left-4 flex items-center space-x-2 bg-black/50 backdrop-blur-sm rounded-lg px-3 py-2">
                    <div className={`w-3 h-3 rounded-full ${
                        connectionState === 'connected' ? 'bg-green-500' :
                        connectionState === 'connecting' ? 'bg-yellow-500 animate-pulse' : 
                        participantConnected ? 'bg-green-500' : 'bg-red-500'
                    } ${connectionState === 'connecting' ? 'animate-pulse' : ''}`}></div>
                    <span className="text-white text-sm font-medium capitalize">
                        {connectionState === 'connected' ? 'Connected' : 
                         connectionState === 'connecting' ? 'Connecting...' :
                         participantConnected ? 'Connected' : 'Waiting'}
                    </span>
                </div>

                {/* Recording Indicator */}
                {recordingActive && (
                    <div className="absolute top-4 right-4 flex items-center space-x-2 bg-red-500/90 backdrop-blur-sm rounded-lg px-3 py-2">
                        <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                        <span className="text-white text-sm font-medium">Recording</span>
                    </div>
                )}

                {/* Screen Share Indicator */}
                {isScreenSharing && (
                    <div className="absolute top-16 right-4 bg-blue-500/90 backdrop-blur-sm rounded-lg px-3 py-2">
                        <span className="text-white text-sm font-medium">🖥️ Screen Sharing</span>
                    </div>
                )}
            </div>

            {/* Control Panel */}
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
                <div className="flex items-center justify-center space-x-4">
                    {/* Mute Button */}
                    <button
                        onClick={toggleMute}
                        className={`p-4 rounded-full transition-all duration-300 ${
                            isMuted 
                                ? 'bg-red-500 hover:bg-red-600 text-white' 
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                        title={isMuted ? 'Unmute' : 'Mute'}
                    >
                        {isMuted ? (
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                            </svg>
                        )}
                    </button>

                    {/* Video Button */}
                    <button
                        onClick={toggleVideo}
                        className={`p-4 rounded-full transition-all duration-300 ${
                            isVideoOff 
                                ? 'bg-red-500 hover:bg-red-600 text-white' 
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                        title={isVideoOff ? 'Turn on camera' : 'Turn off camera'}
                    >
                        {isVideoOff ? (
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728L18.364 5.636" />
                            </svg>
                        ) : (
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        )}
                    </button>

                    {/* Screen Share Button */}
                    <button
                        onClick={isScreenSharing ? stopScreenShare : startScreenShare}
                        className={`p-4 rounded-full transition-all duration-300 ${
                            isScreenSharing 
                                ? 'bg-blue-500 hover:bg-blue-600 text-white' 
                                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                        }`}
                        title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                    </button>

                    {/* Recording Button (Provider only) */}
                    {isProvider && (
                        <button
                            onClick={toggleRecording}
                            className={`p-4 rounded-full transition-all duration-300 ${
                                recordingActive 
                                    ? 'bg-red-500 hover:bg-red-600 text-white' 
                                    : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                            }`}
                            title={recordingActive ? 'Stop recording' : 'Start recording'}
                        >
                            <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z"/>
                                <path d="M12 6c-3.31 0-6 2.69-6 6s2.69 6 6 6 6-2.69 6-6-2.69-6-6-6z"/>
                            </svg>
                        </button>
                    )}

                    {/* Separator */}
                    <div className="w-px h-8 bg-gray-300"></div>

                    {/* End Call Button */}
                    {consultationStarted && (
                        <button
                            onClick={onEndConsultation}
                            className="p-4 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all duration-300"
                            title="End consultation"
                        >
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>

                {/* Status Text */}
                <div className="text-center mt-4">
                    <p className="text-sm text-gray-600">
                        {consultationStatus === 'waiting' ? 'Waiting to start...' :
                         consultationStatus === 'active' ? 
                            (participantConnected ? 'Connected - Consultation in progress' : 'Connecting to participant...') :
                         'Consultation ended'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default EnhancedVideoCall;