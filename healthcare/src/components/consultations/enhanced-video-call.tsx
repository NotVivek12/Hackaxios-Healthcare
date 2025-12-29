'use client';

import { useEffect, useRef, useState } from 'react';
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
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [isScreenSharing, setIsScreenSharing] = useState(false);
    const connectionQuality = 'excellent';
    const [recordingActive, setRecordingActive] = useState(false);
    const [participantConnected, setParticipantConnected] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const myVideo = useRef<HTMLVideoElement>(null);
    const participantVideo = useRef<HTMLVideoElement>(null);

    // Initialize media stream
    useEffect(() => {
        let isMounted = true;
        let localStream: MediaStream | null = null;

        const getMediaStream = async () => {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 1280, height: 720, frameRate: 30 },
                    audio: { echoCancellation: true, noiseSuppression: true }
                });

                if (!isMounted) {
                    mediaStream.getTracks().forEach(track => track.stop());
                    return;
                }

                localStream = mediaStream;
                setStream(mediaStream);
                if (myVideo.current) {
                    myVideo.current.srcObject = mediaStream;
                }
            } catch (err) {
                console.error('Error accessing media devices:', err);
                setError('Could not access camera or microphone. Please check your permissions.');
            }
        };

        getMediaStream();

        return () => {
            isMounted = false;
            if (localStream) {
                localStream.getTracks().forEach(track => track.stop());
            }
        };
    }, []);

    // Simulate participant connection after a delay
    useEffect(() => {
        if (consultationStarted) {
            const timer = setTimeout(() => {
                setParticipantConnected(true);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [consultationStarted]);

    const toggleMute = () => {
        if (stream) {
            stream.getAudioTracks().forEach(track => {
                track.enabled = !track.enabled;
            });
            setIsMuted(!isMuted);
        }
    };

    const toggleVideo = () => {
        if (stream) {
            stream.getVideoTracks().forEach(track => {
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
            
            if (myVideo.current) {
                myVideo.current.srcObject = screenStream;
            }
            setIsScreenSharing(true);

            screenStream.getVideoTracks()[0].onended = () => {
                setIsScreenSharing(false);
                if (myVideo.current && stream) {
                    myVideo.current.srcObject = stream;
                }
            };
        } catch (err) {
            console.error('Error starting screen share:', err);
        }
    };

    const stopScreenShare = () => {
        setIsScreenSharing(false);
        if (myVideo.current && stream) {
            myVideo.current.srcObject = stream;
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
                {/* Participant Video (Main) */}
                <div className="absolute inset-0">
                    {participantConnected && consultationStarted ? (
                        <FadeIn>
                            <video
                                ref={participantVideo}
                                autoPlay
                                playsInline
                                className="w-full h-full object-cover"
                            />
                        </FadeIn>
                    ) : (
                        <div className="h-full flex items-center justify-center">
                            {consultationStarted ? (
                                <div className="text-center text-white">
                                    <div className="animate-spin w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                                    <p className="text-xl font-medium">Connecting...</p>
                                    <p className="text-gray-300">Waiting for {isProvider ? 'patient' : 'doctor'} to join</p>
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
                                        <p className="text-gray-300 mb-6">Click the button below to begin your consultation</p>
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

                {/* My Video (Picture-in-Picture) */}
                {stream && (
                    <div className="absolute bottom-4 right-4 w-48 h-36 bg-black rounded-xl overflow-hidden border-2 border-white shadow-lg z-10">
                        <video
                            ref={myVideo}
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
                        connectionQuality === 'excellent' ? 'bg-green-500' :
                        connectionQuality === 'good' ? 'bg-yellow-500' : 'bg-red-500'
                    } animate-pulse`}></div>
                    <span className="text-white text-sm font-medium capitalize">{connectionQuality}</span>
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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
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
                         consultationStatus === 'active' ? 'Consultation in progress' :
                         'Consultation ended'}
                    </p>
                </div>
            </div>
        </div>
    );
};

export default EnhancedVideoCall;