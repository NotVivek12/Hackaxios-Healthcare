'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from '@/navigation';
import { MedicalConsultationRoom } from '@/components/consultations/medical-consultation-room';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

// Test meeting ID - in production, this would be a real meeting ID
const TEST_MEETING_ID = '507f1f77bcf86cd799439011';

export default function TestVideoPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [isReady, setIsReady] = useState(false);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin');
        } else if (status === 'authenticated') {
            setIsReady(true);
        }
    }, [status, router]);

    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
                <div className="text-center">
                    <div className="animate-spin w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-green-50">
                <div className="text-center bg-white p-8 rounded-2xl shadow-lg">
                    <h1 className="text-2xl font-bold mb-4">Sign In Required</h1>
                    <p className="text-gray-600 mb-6">Please sign in to test video calling.</p>
                    <Link href="/auth/signin">
                        <Button>Sign In</Button>
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50">
            {/* Header */}
            <div className="bg-white border-b px-6 py-4">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-800">🎥 Video Call Test</h1>
                        <p className="text-sm text-gray-600">Test your WebRTC video calling setup</p>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="text-right">
                            <p className="font-medium">{session.user?.name}</p>
                            <p className="text-sm text-gray-500 capitalize">{session.user?.role || 'patient'}</p>
                        </div>
                        <Link href="/dashboard">
                            <Button variant="outline">Back to Dashboard</Button>
                        </Link>
                    </div>
                </div>
            </div>

            {/* Instructions Panel */}
            <div className="max-w-7xl mx-auto px-6 py-4">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4">
                    <h2 className="font-semibold text-blue-800 mb-2">📋 Test Instructions</h2>
                    <ol className="text-sm text-blue-700 space-y-1 list-decimal list-inside">
                        <li>Open this page in <strong>two different browsers</strong> or <strong>incognito windows</strong></li>
                        <li>Sign in as a <strong>provider (doctor)</strong> in one window and <strong>patient</strong> in another</li>
                        <li>Click &quot;Start Consultation&quot; in both windows</li>
                        <li>The doctor&apos;s browser will create an offer, and the patient&apos;s browser will respond</li>
                        <li>You should see each other&apos;s video once connected</li>
                    </ol>
                </div>

                {/* Debug Info */}
                <div className="bg-gray-800 text-green-400 rounded-xl p-4 mb-4 font-mono text-xs">
                    <p>🔧 Debug Info:</p>
                    <p>User ID: {session.user?.id || 'N/A'}</p>
                    <p>User Role: {session.user?.role || 'patient'}</p>
                    <p>Meeting ID: {TEST_MEETING_ID}</p>
                    <p>Is Provider: {session.user?.role === 'provider' ? 'Yes' : 'No'}</p>
                </div>
            </div>

            {/* Video Call Room */}
            <div className="h-[calc(100vh-280px)]">
                {isReady && (
                    <MedicalConsultationRoom
                        consultationId={TEST_MEETING_ID}
                        userId={session.user?.id || ''}
                        userName={session.user?.name || 'Test User'}
                        userRole={session.user?.role || 'patient'}
                        consultation={null}
                    />
                )}
            </div>
        </div>
    );
}
