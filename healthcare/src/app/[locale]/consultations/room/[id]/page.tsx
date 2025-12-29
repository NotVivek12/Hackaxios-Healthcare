'use client';

// Fixed import issues and type definitions
import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from '@/navigation';
import { useParams } from 'next/navigation';
import { MedicalConsultationRoom } from '@/components/consultations/medical-consultation-room';
import { ParticlesBackground } from '@/components/animations/particles-background';
import type { Consultation } from '@/types';

export default function ConsultationRoomPage() {
    const { data: session, status } = useSession();
    const params = useParams();
    const id = params.id as string;
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [consultation, setConsultation] = useState<Consultation | null>(null);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin');
        } else if (status !== 'loading') {
            setIsLoading(false);
        }
    }, [status, router]);

    useEffect(() => {
        const fetchConsultationDetails = async () => {
            if (!session?.user?.id || !id) return;

            try {
                const response = await fetch(`/api/consultations/${id}`, {
                    credentials: 'include'
                });
                
                if (response.ok) {
                    const data = await response.json();
                    setConsultation(data);
                }
            } catch (error) {
                console.error('Error fetching consultation details:', error);
            }
        };

        if (session?.user?.id) {
            fetchConsultationDetails();
        }
    }, [session, id]);

    if (isLoading) {
        return (
            <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-green-50 flex items-center justify-center">
                <ParticlesBackground />
                <div className="relative z-10 text-center">
                    <div className="animate-pulse mb-4">
                        <div className="w-16 h-16 bg-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                            <svg className="w-8 h-8 text-white animate-spin" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                    </div>
                    <h2 className="text-2xl font-semibold text-gray-700 mb-2">Preparing Your Consultation</h2>
                    <p className="text-gray-500">Connecting to secure medical environment...</p>
                </div>
            </div>
        );
    }

    if (!session) {
        return null;
    }

    return (
        <div className="fixed inset-0 bg-gradient-to-br from-blue-50 via-white to-green-50 overflow-hidden">
            <ParticlesBackground />
            <MedicalConsultationRoom
                consultationId={id}
                userId={session.user.id || ''}
                userName={session.user.name || 'User'}
                userRole={session.user.role || 'patient'}
                consultation={consultation}
            />
        </div>
    );
}
