'use client';

import { useState } from 'react';
import { useRouter } from '@/navigation';
import { useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScaleIn } from '@/components/animations/motion-effects';
import AuroraSurface from '@/components/landing/AuroraSurface';

type ConsultationFormData = {
    reason: string;
    date: string;
    time: string;
    type: string;
    providerId?: string;
    symptoms?: string[];
    urgency?: 'routine' | 'urgent' | 'emergency';
    duration?: number;
};

interface ConsultationFormProps {
    variant?: 'standalone' | 'embedded';
}

export default function ConsultationForm({ variant = 'standalone' }: ConsultationFormProps) {
    const router = useRouter();
    const searchParams = useSearchParams();
    const steps = [
        {
            id: 1,
            title: 'Symptoms & Intent',
            description: 'Share what you are feeling and what you expect from the visit.'
        },
        {
            id: 2,
            title: 'Schedule & Format',
            description: 'Pick a time, duration, and consultation medium that suits you.'
        },
        {
            id: 3,
            title: 'Review & Confirm',
            description: 'AI validates readiness and prepares your provider brief.'
        }
    ];

    const [currentStep, setCurrentStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const providerId = searchParams.get('providerId');
    const today = new Date().toISOString().split('T')[0];

    const [formData, setFormData] = useState<ConsultationFormData>({
        reason: '',
        date: '',
        time: '',
        type: 'video',
        providerId: providerId || undefined,
        symptoms: [],
        urgency: 'routine',
        duration: 30
    });

    const handleSubmit = async () => {
        setLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/consultations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    ...formData,
                    scheduledFor: new Date(`${formData.date}T${formData.time}:00.000Z`)
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to book consultation');
            }

            setSuccess(true);
            setTimeout(() => router.push('/consultations'), 2000);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An unexpected error occurred');
        } finally {
            setLoading(false);
        }
    };

    const isStandalone = variant === 'standalone';

    if (success) {
        return (
            <div className={isStandalone ? "min-h-screen bg-[#030613] flex items-center justify-center p-6 relative overflow-hidden text-white" : "text-center text-white"}>
                {isStandalone && <div className="absolute inset-0 aurora-sheen opacity-40" aria-hidden />}
                <ScaleIn>
                    <div className={isStandalone ? "relative z-10 max-w-lg w-full rounded-[32px] border border-white/10 bg-white/10 p-10 text-center backdrop-blur-2xl shadow-[0_30px_120px_rgba(2,6,23,0.7)]" : "space-y-4 rounded-3xl border border-white/10 bg-white/5 p-8"}>
                        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-r from-emerald-400 to-cyan-400 text-4xl">
                            ✓
                        </div>
                        <h2 className="text-3xl font-semibold">Consultation Booked</h2>
                        <p className="mt-3 text-white/70">Your provider has been notified and the virtual room is being staged.</p>
                        <div className="mt-6 text-sm text-cyan-300 animate-pulse">Redirecting to your consultations...</div>
                    </div>
                </ScaleIn>
            </div>
        );
    }

    const containerClass = isStandalone
        ? 'min-h-screen bg-[#030613] bg-[radial-gradient(circle_at_top,_rgba(45,91,255,0.25),_transparent_45%)] px-4 py-10 text-white'
        : 'text-white';

    const gridClass = isStandalone
        ? 'mx-auto grid max-w-6xl gap-8 lg:grid-cols-[2fr,1fr]'
        : 'grid gap-6 lg:grid-cols-[1.4fr,1fr]';

    return (
        <div className={containerClass}>
            <div className={gridClass}>
                <div className="space-y-6">
                    {error && (
                        <div className="mb-6 rounded-2xl border border-red-400/40 bg-red-500/10 p-4 text-sm text-red-200">
                            ⚠️ {error}
                        </div>
                    )}

                    <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-[#11192d] via-[#060c1a] to-[#02040a] p-[1px] shadow-[0_40px_120px_rgba(1,3,12,0.8)]">
                        <div className="relative rounded-[30px] border border-white/5 bg-[#02040a]/70 p-8">
                            <div className="mb-8 hidden items-center gap-4 text-[11px] uppercase tracking-[0.4em] text-white/50 lg:flex">
                                {steps.map((step, index) => (
                                    <div key={step.id} className="flex items-center gap-4">
                                        <span className={`flex h-12 w-12 items-center justify-center rounded-full border text-base font-semibold ${currentStep === step.id ? 'border-cyan-300 bg-cyan-300/10 text-white' : 'border-white/15 text-white/50'}`}>
                                            {step.id}
                                        </span>
                                        {index < steps.length - 1 && <div className="h-px w-12 rounded-full bg-white/15" aria-hidden />}
                                    </div>
                                ))}
                            </div>

                            <div className="space-y-10">
                                <div>
                                    <p className="text-xs uppercase tracking-[0.5em] text-white/60">Step {currentStep} of {steps.length}</p>
                                    <h1 className="mt-4 text-3xl font-semibold text-white">{steps[currentStep - 1].title}</h1>
                                    <p className="mt-2 text-white/70">{steps[currentStep - 1].description}</p>
                                </div>

                                {currentStep === 1 && (
                                    <div className="space-y-6">
                                        <label className="text-sm uppercase tracking-[0.3em] text-white/60">What brings you here today?</label>
                                        <textarea
                                            value={formData.reason}
                                            onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                                            className="min-h-[180px] w-full rounded-3xl border border-white/15 bg-[#050c1c]/80 p-6 text-white placeholder:text-white/30 focus:border-cyan-300 focus:outline-none"
                                            placeholder="Describe your symptoms, triggers, and expectations..."
                                        />
                                        <div className="flex flex-wrap gap-3 text-sm text-white/80">
                                            {["Chest tightness", "Follow-up", "Medication review", "Lab interpretation"].map(chip => (
                                                <button
                                                    key={chip}
                                                    type="button"
                                                    onClick={() => setFormData(prev => ({ ...prev, reason: prev.reason ? `${prev.reason} ${chip}` : chip }))}
                                                    className="rounded-full border border-white/15 bg-white/5 px-4 py-2 backdrop-blur hover:border-cyan-300"
                                                >
                                                    {chip}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {currentStep === 2 && (
                                    <div className="grid gap-6 md:grid-cols-2">
                                        <div className="space-y-3">
                                            <label className="text-sm uppercase tracking-[0.3em] text-white/60">Preferred Date</label>
                                            <Input
                                                type="date"
                                                min={today}
                                                value={formData.date}
                                                onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                                className="rounded-3xl border-white/15 bg-[#050c1c]/80 text-white"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-sm uppercase tracking-[0.3em] text-white/60">Preferred Time</label>
                                            <Input
                                                type="time"
                                                value={formData.time}
                                                onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                                                className="rounded-3xl border-white/15 bg-[#050c1c]/80 text-white"
                                            />
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-sm uppercase tracking-[0.3em] text-white/60">Consultation Type</label>
                                            <select
                                                value={formData.type}
                                                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                                                className="w-full rounded-3xl border border-white/15 bg-[#050c1c]/80 p-4 text-white"
                                            >
                                                <option value="video" className="text-gray-900">Video</option>
                                                <option value="audio" className="text-gray-900">Audio</option>
                                                <option value="in-person" className="text-gray-900">In person</option>
                                            </select>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="text-sm uppercase tracking-[0.3em] text-white/60">Urgency</label>
                                            <div className="grid grid-cols-3 gap-3 text-sm">
                                                {["routine", "urgent", "emergency"].map(level => (
                                                    <button
                                                        key={level}
                                                        type="button"
                                                        onClick={() => setFormData(prev => ({ ...prev, urgency: level as typeof formData.urgency }))}
                                                        className={`rounded-2xl border px-3 py-2 capitalize ${formData.urgency === level ? 'border-cyan-300 bg-cyan-300/20 text-white' : 'border-white/10 text-white/60'}`}
                                                    >
                                                        {level}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {currentStep === 3 && (
                                    <div className="space-y-6">
                                        <div className="rounded-3xl border border-white/15 bg-[#050c1c]/70 p-6">
                                            <p className="text-xs uppercase tracking-[0.4em] text-white/50">AI Prep Summary</p>
                                            <p className="mt-3 text-white/80">{formData.reason || 'Symptom details will appear here once provided.'}</p>
                                            <div className="mt-4 grid gap-3 text-sm text-white/70">
                                                <div className="flex items-center justify-between"><span>Date</span><span>{formData.date || '--'}</span></div>
                                                <div className="flex items-center justify-between"><span>Time</span><span>{formData.time || '--'}</span></div>
                                                <div className="flex items-center justify-between"><span>Mode</span><span>{formData.type}</span></div>
                                                <div className="flex items-center justify-between"><span>Urgency</span><span className="capitalize">{formData.urgency}</span></div>
                                            </div>
                                        </div>
                                        <p className="text-sm text-white/70">Once you confirm, your provider receives this brief plus vitals so they can join prepared.</p>
                                    </div>
                                )}

                                <div className="flex flex-wrap gap-3">
                                    {currentStep > 1 && (
                                        <Button variant="ghost" className="rounded-full border border-white/20 bg-white/5 text-white hover:bg-white/10" onClick={() => setCurrentStep(step => step - 1)}>
                                            Back
                                        </Button>
                                    )}
                                    {currentStep < steps.length && (
                                        <Button
                                            variant="gradient"
                                            className="rounded-full bg-gradient-to-r from-[#52f6ff] via-[#6284ff] to-[#b14dff] text-white shadow-[0_20px_60px_rgba(47,104,255,0.4)]"
                                            onClick={() => setCurrentStep(step => step + 1)}
                                            disabled={currentStep === 1 && !formData.reason}
                                        >
                                            Continue
                                        </Button>
                                    )}
                                    {currentStep === steps.length && (
                                        <Button
                                            variant="gradient"
                                            className="rounded-full bg-gradient-to-r from-[#52f6ff] via-[#6284ff] to-[#b14dff] text-white shadow-[0_20px_60px_rgba(47,104,255,0.4)]"
                                            onClick={handleSubmit}
                                            disabled={loading || !formData.reason || !formData.date || !formData.time}
                                        >
                                            {loading ? 'Confirming...' : 'Book Consultation'}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-6">
                    <AuroraSurface variant="calm" className="text-sm border-white/5 bg-gradient-to-b from-[#0d1a30]/70 to-[#050914]/80" interactive>
                        <p className="text-xs uppercase tracking-[0.4em] text-white/60">Provider Signal</p>
                        <h3 className="mt-2 text-2xl font-semibold">Precision-matched care</h3>
                        <p className="mt-2 text-white/70">We analyze availability, expertise, languages, and past interactions to assign the ideal clinician.</p>
                        <div className="mt-6 grid gap-3 text-white/70">
                            <div className="flex items-center justify-between">
                                <span>Providers online</span>
                                <span>18</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Avg. wait</span>
                                <span>6 min</span>
                            </div>
                            <div className="flex items-center justify-between">
                                <span>Languages</span>
                                <span>10+</span>
                            </div>
                        </div>
                    </AuroraSurface>

                    <AuroraSurface variant="ember" className="border-white/5 bg-gradient-to-b from-[#16222f]/80 to-[#150b18]/80">
                        <p className="text-xs uppercase tracking-[0.4em] text-white/60">AI Insight</p>
                        <h3 className="mt-2 text-2xl font-semibold">Smart suggestions</h3>
                        <div className="mt-4 space-y-3 text-sm text-white/80">
                            {["Add recent vitals to reduce follow-up questions", "Upload photos or labs for faster review", "Enable SMS updates for new instructions"].map(suggestion => (
                                <div key={suggestion} className="rounded-2xl border border-white/15 bg-white/5 px-4 py-3">
                                    {suggestion}
                                </div>
                            ))}
                        </div>
                    </AuroraSurface>
                </div>
            </div>
        </div>
    );
}
