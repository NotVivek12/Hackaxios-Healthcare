'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/navigation';
import ConsultationForm from '@/components/consultations/consultation-form';
import ConsultationsList from '@/components/consultations/consultations-list';
import { Video, Calendar, Clock } from 'lucide-react';

export default function ConsultationsPage() {
    const { data: session, status } = useSession();
    const t = useTranslations('Consultations');
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin');
        } else if (status !== 'loading') {
            setIsLoading(false);
        }
    }, [status, router]);

    if (isLoading) {
        return <div className="container mx-auto px-4 py-8">Loading...</div>;
    }

    if (!session) {
        return null; // Router will redirect, this prevents flash of content
    }

    return (
        <div className="future-page relative min-h-screen overflow-hidden bg-[#01030f] text-white">
            <div className="absolute inset-0">
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(87,120,255,0.35),_transparent_45%)]" aria-hidden />
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,_rgba(82,246,255,0.12),_transparent_35%)]" aria-hidden />
            </div>

            <div className="relative z-10 mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
                <div className="text-center">
                    <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-[#5c6cff] to-[#9b4dff] shadow-[0_20px_80px_rgba(86,99,255,0.45)]">
                        <Video className="h-10 w-10 text-white" />
                    </div>
                    <p className="mt-6 text-sm uppercase tracking-[0.6em] text-white/60">{t('subtitle')}</p>
                    <h1 className="mt-4 text-4xl font-semibold text-transparent sm:text-5xl bg-clip-text bg-gradient-to-r from-[#57afea] via-[#9f6bff] to-[#ff65b0]">
                        {t('title')}
                    </h1>
                </div>

                <div className="mt-12 grid gap-8 lg:grid-cols-[1.2fr,0.8fr]">
                    <section className="space-y-8">
                        <div className="rounded-[32px] border border-white/5 bg-white/5 p-[1px] shadow-[0_30px_120px_rgba(1,5,22,0.7)]">
                            <div className="rounded-[30px] bg-[#060b1b]/90 p-6">
                                <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                                    <div>
                                        <p className="text-xs uppercase tracking-[0.5em] text-white/50">{t('upcomingConsultations')}</p>
                                        <h2 className="mt-2 text-2xl font-semibold">Stay on schedule</h2>
                                    </div>
                                    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
                                        <Clock className="h-4 w-4 text-cyan-300" />
                                        Next slot opens in 8 min
                                    </div>
                                </div>
                                <ConsultationsList />
                            </div>
                        </div>

                        <div className="rounded-[32px] border border-white/5 bg-white/5 p-[1px] shadow-[0_20px_80px_rgba(1,5,22,0.5)]">
                            <div className="rounded-[30px] bg-[#040818]/90 p-6">
                                <div className="mb-6 flex items-center gap-3">
                                    <Calendar className="h-5 w-5 text-violet-300" />
                                    <h2 className="text-2xl font-semibold">{t('pastConsultations')}</h2>
                                </div>
                                <ConsultationsList isPast={true} />
                            </div>
                        </div>
                    </section>

                    <aside className="space-y-6">
                        <div className="rounded-[32px] border border-white/10 bg-[#050916]/80 p-1 shadow-[0_40px_120px_rgba(2,6,23,0.75)]">
                            <div className="rounded-[28px] bg-[#02040a]/90 p-6">
                                <div className="mb-6">
                                    <p className="text-xs uppercase tracking-[0.5em] text-white/60">{t('bookConsultation')}</p>
                                    <h2 className="mt-3 text-3xl font-semibold">Your concierge care lane</h2>
                                </div>
                                <ConsultationForm variant="embedded" />
                            </div>
                        </div>
                    </aside>
                </div>
            </div>
        </div>
    );
}
