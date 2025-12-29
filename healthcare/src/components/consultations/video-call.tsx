'use client';

import { useEffect, useRef, useState } from 'react';
import Peer from 'simple-peer';
import { io, Socket } from 'socket.io-client';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';

interface VideoCallProps {
    consultationId: string;
    userId: string;
    userName: string;
    isProvider?: boolean;
}

export const VideoCall = ({ consultationId, userId, userName }: VideoCallProps) => {
    const t = useTranslations('ConsultationRoom');
    const [socket, setSocket] = useState<Socket | null>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [receivingCall, setReceivingCall] = useState(false);
    const [caller, setCaller] = useState('');
    const [callerSignal, setCallerSignal] = useState<unknown>(null);
    const [callAccepted, setCallAccepted] = useState(false);
    const [isCalling, setIsCalling] = useState(false);
    const [callEnded, setCallEnded] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isVideoOff, setIsVideoOff] = useState(false);
    const [chatMessages, setChatMessages] = useState<{ sender: string; text: string; time: string }[]>([]);
    const [messageInput, setMessageInput] = useState('');
    const [error, setError] = useState<string | null>(null);

    const myVideo = useRef<HTMLVideoElement>(null);
    const userVideo = useRef<HTMLVideoElement>(null);
    const connectionRef = useRef<Peer.Instance | null>(null);
    const chatContainerRef = useRef<HTMLDivElement>(null);

    // Initialize socket connection
    useEffect(() => {
        // Connect to the socket server
        const newSocket = io('', {
            path: '/api/socket',
            addTrailingSlash: false,
        });

        setSocket(newSocket);

        return () => {
            if (newSocket) newSocket.disconnect();
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }
        };
    }, [stream]);

    // Set up media stream
    useEffect(() => {
        const getMediaStream = async () => {
            try {
                const mediaStream = await navigator.mediaDevices.getUserMedia({
                    video: true,
                    audio: true
                });
                setStream(mediaStream);
                if (myVideo.current) {
                    myVideo.current.srcObject = mediaStream;
                }
            } catch (err) {
                console.error("Error accessing media devices:", err);
                setError("Could not access camera or microphone. Please check your permissions.");
            }
        };

        getMediaStream();
    }, []);

    // Set up socket event listeners
    useEffect(() => {
        if (!socket) return;

        // Join the consultation room
        socket.emit('join-room', consultationId, userId);

        // Handle incoming call signals
        socket.on('signal', ({ userId: callerId, signal }) => {
            if (!callAccepted) {
                setReceivingCall(true);
                setCaller(callerId);
                setCallerSignal(signal);
            } else if (connectionRef.current) {
                connectionRef.current.signal(signal);
            }
        });

        // Handle user connection/disconnection
        socket.on('user-connected', (newUserId) => {
            console.log(`User connected: ${newUserId}`);
        });

        socket.on('user-disconnected', (disconnectedUserId) => {
            console.log(`User disconnected: ${disconnectedUserId}`);
            if (callAccepted && !callEnded) {
                endCall();
            }
        });

        // Handle chat messages
        socket.on('receive-message', ({ message, sender, timestamp }) => {
            const time = new Date(timestamp).toLocaleTimeString();
            setChatMessages(prev => [...prev, { sender, text: message, time }]);
        });

        return () => {
            socket.off('signal');
            socket.off('user-connected');
            socket.off('user-disconnected');
            socket.off('receive-message');
        };
    }, [socket, consultationId, userId, callAccepted, callEnded, stream]);

    // Auto-scroll chat when new messages arrive
    useEffect(() => {
        if (chatContainerRef.current) {
            chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
        }
    }, [chatMessages]);

    const callUser = () => {
        if (!socket || !stream) return;

        setIsCalling(true);

        const peer = new Peer({
            initiator: true,
            trickle: false,
            stream: stream
        });

        peer.on('signal', (data) => {
            socket.emit('signal', {
                userId,
                roomId: consultationId,
                signal: data
            });
        });

        peer.on('stream', (remoteStream) => {
            if (userVideo.current) {
                userVideo.current.srcObject = remoteStream;
            }
        });

        peer.on('error', (err) => {
            console.error('Peer error:', err);
            setError(`Connection error: ${err.message}`);
            setIsCalling(false);
        });

        connectionRef.current = peer;
    };

    const answerCall = () => {
        if (!socket || !stream || !callerSignal) return;

        setCallAccepted(true);
        setReceivingCall(false);

        const peer = new Peer({
            initiator: false,
            trickle: false,
            stream: stream
        });

        peer.on('signal', (data) => {
            socket.emit('signal', {
                userId,
                roomId: consultationId,
                signal: data
            });
        });

        peer.on('stream', (remoteStream) => {
            if (userVideo.current) {
                userVideo.current.srcObject = remoteStream;
            }
        });

        peer.on('error', (err) => {
            console.error('Peer error:', err);
            setError(`Connection error: ${err.message}`);
        });

        // Connect with the caller's signal data
        peer.signal(callerSignal as Peer.SignalData);
        connectionRef.current = peer;
    };

    const endCall = () => {
        setCallEnded(true);
        if (connectionRef.current) {
            connectionRef.current.destroy();
        }
        // Redirect to consultations page after call ends
        setTimeout(() => {
            window.location.href = '/consultations';
        }, 2000);
    };

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

    const sendMessage = () => {
        if (!socket || !messageInput.trim()) return;

        const time = new Date().toLocaleTimeString();

        socket.emit('send-message', {
            roomId: consultationId,
            message: messageInput,
            sender: userName
        });

        setChatMessages(prev => [...prev, {
            sender: userName,
            text: messageInput,
            time
        }]);

        setMessageInput('');
    };

    if (error) {
        return (
            <div className="flex flex-col items-center justify-center h-64 bg-red-50 rounded-lg p-4">
                <p className="text-red-500 mb-4">{error}</p>
                <Button onClick={() => window.location.reload()}>
                    {t('retryConnection')}
                </Button>
            </div>
        );
    }

    return (
        <div className="w-full">
            {/* Video containers */}
            <div className="relative bg-black rounded-lg aspect-video w-full mb-4 overflow-hidden">
                {stream && (
                    <video
                        ref={myVideo}
                        muted
                        autoPlay
                        playsInline
                        className="absolute bottom-4 right-4 w-1/4 h-auto rounded-lg z-10 border-2 border-white"
                    />
                )}

                {callAccepted && !callEnded ? (
                    <video
                        ref={userVideo}
                        autoPlay
                        playsInline
                        className="w-full h-full object-cover"
                    />
                ) : (
                    <div className="flex items-center justify-center h-full">
                        {receivingCall && !callAccepted ? (
                            <div className="text-center">
                                <p className="text-white mb-4">{`${caller} ${t('isCallingYou')}`}</p>
                                <Button onClick={answerCall} className="bg-green-600 hover:bg-green-700">
                                    {t('answer')}
                                </Button>
                            </div>
                        ) : isCalling ? (
                            <p className="text-white">{t('calling')}</p>
                        ) : !callEnded ? (
                            <div className="text-center">
                                <p className="text-white mb-4">{t('readyToConnect')}</p>
                                <Button onClick={callUser} className="bg-blue-600 hover:bg-blue-700">
                                    {t('startCall')}
                                </Button>
                            </div>
                        ) : (
                            <p className="text-white">{t('callEnded')}</p>
                        )}
                    </div>
                )}
            </div>

            {/* Controls */}
            <div className="flex justify-center space-x-4 p-4 bg-gray-100 rounded-lg mb-4">
                <button
                    className={`p-3 ${callEnded ? 'bg-gray-400' : 'bg-red-600'} text-white rounded-full`}
                    onClick={endCall}
                    disabled={callEnded}
                    aria-label={t('endCall')}
                    title={t('endCall')}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                </button>

                <button
                    className={`p-3 ${isMuted ? 'bg-red-500' : 'bg-gray-700'} text-white rounded-full`}
                    onClick={toggleMute}
                    disabled={!stream || callEnded}
                    aria-label={t('toggleMute')}
                    title={t('toggleMute')}
                >
                    {isMuted ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                        </svg>
                    )}
                </button>

                <button
                    className={`p-3 ${isVideoOff ? 'bg-red-500' : 'bg-gray-700'} text-white rounded-full`}
                    onClick={toggleVideo}
                    disabled={!stream || callEnded}
                    aria-label={t('toggleCamera')}
                    title={t('toggleCamera')}
                >
                    {isVideoOff ? (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
                        </svg>
                    ) : (
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                    )}
                </button>
            </div>

            {/* Chat Section */}
            <div className="bg-white rounded-lg shadow-md p-4">
                <h2 className="text-xl font-semibold mb-4">{t('chat')}</h2>
                <div
                    ref={chatContainerRef}
                    className="h-64 bg-gray-50 rounded-md p-4 mb-4 overflow-y-auto"
                >
                    {chatMessages.length > 0 ? (
                        chatMessages.map((msg, index) => (
                            <div
                                key={index}
                                className={`mb-2 p-2 rounded-lg max-w-3/4 ${msg.sender === userName ?
                                    'ml-auto bg-blue-100 text-blue-800' :
                                    'bg-gray-100 text-gray-800'}`}
                            >
                                <p className="text-xs text-gray-500">{msg.sender}</p>
                                <p>{msg.text}</p>
                                <p className="text-xs text-right text-gray-500">{msg.time}</p>
                            </div>
                        ))
                    ) : (
                        <p className="text-center text-gray-500">{t('chatPlaceholder')}</p>
                    )}
                </div>
                <div className="flex">
                    <input
                        type="text"
                        value={messageInput}
                        onChange={(e) => setMessageInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
                        className="flex-1 p-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={t('typeMessage')}
                        disabled={callEnded}
                    />
                    <button
                        className="bg-blue-600 text-white p-2 rounded-r-md"
                        onClick={sendMessage}
                        disabled={!messageInput.trim() || callEnded}
                        aria-label={t('sendMessage')}
                        title={t('sendMessage')}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </div>
            </div>
        </div>
    );
};
