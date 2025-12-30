'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { EnhancedVideoCall } from '@/components/consultations/enhanced-video-call';
import { Button } from '@/components/ui/button';

export default function TestVideoPage() {
    const { data: session } = useSession();
    const [consultationStarted, setConsultationStarted] = useState(false);
    const [consultationStatus, setConsultationStatus] = useState('waiting');

    // Mock consultation ID for testing
    const mockConsultationId = '507f1f77bcf86cd799439011';

    const handleStartConsultation = () => {
        setConsultationStarted(true);
        setConsultationStatus('active');
    };

    const handleEndConsultation = () => {
        setConsultationStarted(false);
        setConsultationStatus('ended');
    };

    if (!session) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 flex items-center justify-center">
                <div className="text-white text-center">
                    <h1 className="text-2xl font-bold mb-4">Please sign in to test video calling</h1>
                    <Button onClick={() => window.location.href = '/auth/signin'}>
                        Sign In
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900">
            <div className="container mx-auto p-4">
                <div className="mb-4 text-white text-center">
                    <h1 className="text-2xl font-bold mb-2">Video Call Test</h1>
                    <p className="text-gray-300">
                        Testing as: {session.user?.name} ({session.user?.role})
                    </p>
                    <p className="text-sm text-gray-400">
                        Open this page in two different browsers/devices with different user accounts to test peer-to-peer connection
                    </p>
                </div>

                <div className="h-[80vh]">
                    <EnhancedVideoCall
                        consultationId={mockConsultationId}
                        userId={session.user?.id || ''}
                        userName={session.user?.name || 'Test User'}
                        isProvider={session.user?.role === 'provider'}
                        onStartConsultation={handleStartConsultation}
                        onEndConsultation={handleEndConsultation}
                        consultationStarted={consultationStarted}
                        consultationStatus={consultationStatus}
                    />
                </div>
            </div>
        </div>
    );
}