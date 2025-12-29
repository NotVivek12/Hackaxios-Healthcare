'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MedicalAnimations } from '@/components/animations/medical-animations';
import { FadeIn, ScaleIn, SlideInFromBottom } from '@/components/animations/motion-effects';
import { EnhancedVideoCall } from './enhanced-video-call';
import { MedicalNotes } from './medical-notes';
import { VitalSigns } from './vital-signs';
import { DiagnosticTools } from './diagnostic-tools';
import type { Consultation } from '@/types';

type PanelKey = 'video' | 'notes' | 'vitals' | 'tools';

interface NavigationItem {
    id: PanelKey;
    icon: string;
    label: string;
}

interface MedicalConsultationRoomProps {
    consultationId: string;
    userId: string;
    userName: string;
    userRole: string;
    consultation?: Consultation | null;
}

export const MedicalConsultationRoom = ({
    consultationId,
    userId,
    userName,
    userRole,
    consultation
}: MedicalConsultationRoomProps) => {
    const [activePanel, setActivePanel] = useState<PanelKey>('video');
    const [isMinimized, setIsMinimized] = useState(false);
    const [consultationStarted, setConsultationStarted] = useState(false);
    const [consultationStatus, setConsultationStatus] = useState('waiting');

    const isProvider = userRole === 'provider';
    const navigationItems: NavigationItem[] = [
        { id: 'video', icon: '🎥', label: 'Video' },
        { id: 'notes', icon: '📝', label: 'Notes' },
        { id: 'vitals', icon: '💓', label: 'Vitals' },
        { id: 'tools', icon: '🔬', label: 'Tools' }
    ];

    const handleStartConsultation = () => {
        setConsultationStarted(true);
        setConsultationStatus('active');
    };

    const handleEndConsultation = () => {
        setConsultationStatus('ended');
        // Redirect after a brief delay
        setTimeout(() => {
            window.location.href = '/consultations';
        }, 3000);
    };

    return (
        <div className="relative h-screen flex flex-col bg-gradient-to-br from-slate-50 via-blue-50 to-green-50">
            {/* Medical Header with Vital Info */}
            <FadeIn>
                <div className="bg-white/90 backdrop-blur-sm border-b border-blue-200 px-6 py-4 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-6">
                            <div className="flex items-center space-x-3">
                                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 9.172V5L8 4z" />
                                    </svg>
                                </div>
                                <div>
                                    <h1 className="text-xl font-semibold text-gray-800">Medical Consultation</h1>
                                    <p className="text-sm text-gray-600">
                                        ID: {consultationId.slice(-8).toUpperCase()}
                                    </p>
                                </div>
                            </div>

                            <div className="hidden md:flex items-center space-x-4">
                                <div className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                                    {consultationStatus === 'waiting' ? 'Preparing' : 
                                     consultationStatus === 'active' ? 'In Session' : 'Completed'}
                                </div>
                                {consultation && (
                                    <div className="text-sm text-gray-600">
                                        <span className="font-medium">Reason:</span> {consultation.reason}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            <div className="text-right text-sm">
                                <div className="font-medium text-gray-800">{userName}</div>
                                <div className="text-gray-500 capitalize">{userRole}</div>
                            </div>
                            <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center text-white font-semibold">
                                {userName.charAt(0).toUpperCase()}
                            </div>
                        </div>
                    </div>
                </div>
            </FadeIn>

            {/* Main Consultation Interface */}
            <div className="flex-1 flex">
                {/* Left Panel - Navigation */}
                <SlideInFromBottom delay={0.2}>
                    <div className="w-20 bg-white/80 backdrop-blur-sm border-r border-blue-200 flex flex-col items-center py-6 space-y-4">
                        {navigationItems.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => setActivePanel(item.id)}
                                className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all duration-300 ${
                                    activePanel === item.id
                                        ? 'bg-gradient-to-r from-blue-500 to-green-500 text-white shadow-lg scale-110'
                                        : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
                                }`}
                                title={item.label}
                            >
                                {item.icon}
                            </button>
                        ))}
                    </div>
                </SlideInFromBottom>

                {/* Main Content Area */}
                <div className="flex-1 relative">
                    {activePanel === 'video' && (
                        <ScaleIn>
                            <EnhancedVideoCall
                                consultationId={consultationId}
                                userId={userId}
                                userName={userName}
                                isProvider={isProvider}
                                onStartConsultation={handleStartConsultation}
                                onEndConsultation={handleEndConsultation}
                                consultationStarted={consultationStarted}
                                consultationStatus={consultationStatus}
                            />
                        </ScaleIn>
                    )}

                    {activePanel === 'notes' && (
                        <FadeIn>
                            <MedicalNotes
                                consultationId={consultationId}
                                isProvider={isProvider}
                                consultation={consultation}
                            />
                        </FadeIn>
                    )}

                    {activePanel === 'vitals' && (
                        <FadeIn>
                            <VitalSigns
                                consultationId={consultationId}
                                isProvider={isProvider}
                            />
                        </FadeIn>
                    )}

                    {activePanel === 'tools' && (
                        <FadeIn>
                            <DiagnosticTools
                                consultationId={consultationId}
                                isProvider={isProvider}
                            />
                        </FadeIn>
                    )}

                    {/* Medical Animations Overlay */}
                    <div className="absolute inset-0 pointer-events-none">
                        <MedicalAnimations activePanel={activePanel} />
                    </div>
                </div>

                {/* Right Panel - Quick Actions */}
                <SlideInFromBottom delay={0.4}>
                    <div className="w-80 bg-white/80 backdrop-blur-sm border-l border-blue-200 p-6 space-y-6">
                        {/* Quick Stats */}
                        <div className="space-y-4">
                            <h3 className="font-semibold text-gray-800 text-lg">Session Overview</h3>
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-blue-50 p-3 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-blue-600">15:30</div>
                                    <div className="text-xs text-blue-500">Duration</div>
                                </div>
                                <div className="bg-green-50 p-3 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-green-600">98%</div>
                                    <div className="text-xs text-green-500">Quality</div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Actions */}
                        <div className="space-y-3">
                            <h3 className="font-semibold text-gray-800">Quick Actions</h3>
                            <div className="space-y-2">
                                <Button 
                                    variant="outline" 
                                    className="w-full justify-start"
                                    onClick={() => setActivePanel('notes')}
                                >
                                    <span className="mr-2">📋</span>
                                    Review Notes
                                </Button>
                                <Button 
                                    variant="outline" 
                                    className="w-full justify-start"
                                    onClick={() => setActivePanel('vitals')}
                                >
                                    <span className="mr-2">💊</span>
                                    Check Vitals
                                </Button>
                                <Button 
                                    variant="outline" 
                                    className="w-full justify-start"
                                    onClick={() => setActivePanel('tools')}
                                >
                                    <span className="mr-2">🔍</span>
                                    Diagnostic Tools
                                </Button>
                            </div>
                        </div>

                        {/* Emergency Actions */}
                        {isProvider && (
                            <div className="space-y-3 border-t pt-4">
                                <h3 className="font-semibold text-red-600">Emergency</h3>
                                <Button variant="destructive" className="w-full" size="sm">
                                    🚨 Call Emergency Services
                                </Button>
                            </div>
                        )}

                        {/* Connection Status */}
                        <div className="space-y-2 border-t pt-4">
                            <h3 className="font-semibold text-gray-800 text-sm">Connection</h3>
                            <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                                <span className="text-sm text-green-600 font-medium">Secure Connection</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                                <span className="text-sm text-blue-600">End-to-End Encrypted</span>
                            </div>
                        </div>
                    </div>
                </SlideInFromBottom>
            </div>

            {/* Bottom Action Bar */}
            <FadeIn delay={0.6}>
                <div className="bg-white/90 backdrop-blur-sm border-t border-blue-200 px-6 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-2 text-sm text-gray-600">
                                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                                <span>Session Active</span>
                            </div>
                        </div>

                        <div className="flex items-center space-x-3">
                            <Button 
                                variant="outline"
                                onClick={() => setIsMinimized(!isMinimized)}
                                size="sm"
                            >
                                {isMinimized ? 'Expand' : 'Minimize'}
                            </Button>
                            
                            {consultationStatus === 'active' && (
                                <Button 
                                    variant="destructive"
                                    onClick={handleEndConsultation}
                                    size="sm"
                                >
                                    End Consultation
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </FadeIn>
        </div>
    );
};

export default MedicalConsultationRoom;