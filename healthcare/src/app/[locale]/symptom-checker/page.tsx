'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import {
    Stethoscope,
    Plus,
    X,
    AlertTriangle,
    CheckCircle,
    Sparkles,
    Activity,
    ShieldAlert,
    Timer,
    HeartPulse
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { type SymptomInput, type AIAnalysis } from '@/lib/ai/symptom-analyzer';
import { cn } from '@/lib/utils';
import { useToast, ToastContainer } from '@/components/ui/toast';
import { EmergencyContact } from '@/components/symptom-checker/emergency-contact';
import { ParticlesBackground } from '@/components/animations/particles-background';
import { useRouter, usePathname } from '@/navigation';
import { FadeIn, ScaleIn, StaggerContainer } from '@/components/animations/motion-effects';

const quickSymptomLibrary = ['Fever', 'Chest tightness', 'Nausea', 'Shortness of breath', 'Fatigue', 'Joint pain'];
const reassuranceTips = [
    'Keep a log of symptom frequency throughout the day.',
    'Stay hydrated and avoid skipping meals while you wait.',
    'Reach out to a trusted contact if your condition escalates.'
];
const carePhases = [
    {
        title: 'Symptom intake',
        description: 'Capture what you feel, when it started, and how intense it is.',
        icon: Sparkles
    },
    {
        title: 'AI triage',
        description: 'Our model benchmarks your inputs against global clinical data.',
        icon: Activity
    },
    {
        title: 'Care navigation',
        description: 'You receive tailored next steps, safety guidance, and follow-ups.',
        icon: HeartPulse
    }
];
const riskPalette: Record<string, string> = {
    low: 'from-emerald-500/30 via-emerald-400/10 to-transparent',
    medium: 'from-amber-400/40 via-orange-400/10 to-transparent',
    high: 'from-orange-500/40 via-red-400/10 to-transparent',
    critical: 'from-rose-500/40 via-red-500/10 to-transparent'
};
const urgencyPalette: Record<string, string> = {
    routine: 'from-sky-500/30 via-blue-500/10 to-transparent',
    urgent: 'from-amber-400/30 via-orange-500/10 to-transparent',
    emergency: 'from-rose-500/40 via-red-500/10 to-transparent'
};

export default function SymptomCheckerPage() {
    const t = useTranslations('SymptomChecker');
    const { toasts, removeToast, success, error: showError } = useToast();
    const router = useRouter();
    const pathname = usePathname();

    const [symptoms, setSymptoms] = useState<SymptomInput[]>([]);
    const [currentSymptom, setCurrentSymptom] = useState<SymptomInput>({
        name: '',
        severity: 'mild',
        duration: '',
        description: '',
    });
    const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isClient, setIsClient] = useState(false);
    const [showEmergencyForm, setShowEmergencyForm] = useState(false);
    const stageIndex = analysis ? 2 : isAnalyzing ? 1 : symptoms.length > 0 ? 0 : 0;
    const activePhaseLabel = carePhases[stageIndex]?.title ?? carePhases[0].title;
    const formatLabel = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

    // This helps prevent hydration errors by ensuring forms render only client-side
    useEffect(() => {
        setIsClient(true);
    }, []);

    const addSymptom = () => {
        if (currentSymptom.name && currentSymptom.duration) {
            setSymptoms([...symptoms, currentSymptom]);
            setCurrentSymptom({
                name: '',
                severity: 'mild',
                duration: '',
                description: '',
            });
        }
    };

    const removeSymptom = (index: number) => {
        setSymptoms(symptoms.filter((_, i) => i !== index));
    };

    const handleAnalyze = async () => {
        setIsAnalyzing(true);
        setError(null);

        try {
            // Add AbortController with timeout to prevent UI freeze on slow responses
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

            console.log('Submitting symptoms for analysis:', symptoms);

            const result = await fetch('/api/symptom-check', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ symptoms }),
                signal: controller.signal
            });

            // Clear timeout
            clearTimeout(timeoutId);

            const responseData = await result.json();

            if (!result.ok) {
                throw new Error(responseData.error || 'Failed to analyze symptoms');
            }

            console.log('Analysis result:', responseData.analysis);

            if (!responseData.analysis || !responseData.analysis.riskLevel) {
                throw new Error('Invalid response format from symptom checker API');
            }

            setAnalysis(responseData.analysis);

            // Auto show emergency contact form for critical or emergency cases
            if (responseData.analysis.riskLevel === 'critical' || responseData.analysis.urgency === 'emergency') {
                setShowEmergencyForm(true);
            }
        } catch (error) {
            console.error('Error analyzing symptoms:', error);
            let errorMessage = 'An unexpected error occurred while analyzing symptoms. Please try again later.';

            if (error instanceof Error) {
                if (error.name === 'AbortError') {
                    errorMessage = 'Analysis is taking longer than expected. Please try again with fewer symptoms.';
                } else {
                    errorMessage = error.message;
                }
            }

            setError(errorMessage);
        } finally {
            setIsAnalyzing(false);
        }
    };

    // Render a simple skeleton during SSR to prevent hydration mismatch
    if (!isClient) {
        return (
            <div className="future-page min-h-screen bg-slate-950 py-12">
                <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
                    <div className="rounded-3xl border border-white/10 bg-white/5 p-10 text-center text-white">
                        <Stethoscope className="mx-auto mb-4 h-14 w-14 text-cyan-300" />
                        <div className="mx-auto mb-3 h-4 w-24 animate-pulse rounded-full bg-white/20" />
                        <div className="mx-auto h-4 w-32 animate-pulse rounded-full bg-white/10" />
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="future-page relative min-h-screen overflow-hidden bg-slate-950 text-white">
            <ParticlesBackground variant="medical" />

            <div className="relative z-10 px-4 py-24 sm:px-6 lg:px-10">
                <div className="mx-auto max-w-6xl space-y-10">
                    <ToastContainer toasts={toasts} removeToast={removeToast} />

                    <FadeIn>
                        <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-indigo-900/80 via-slate-950 to-slate-900/60 p-10 shadow-[0_0_60px_rgba(56,189,248,0.25)]">
                            <div className="absolute inset-0 opacity-40">
                                <div className="absolute -left-20 top-0 h-56 w-56 rounded-full bg-cyan-500/30 blur-3xl" />
                                <div className="absolute -right-10 bottom-0 h-64 w-64 rounded-full bg-purple-600/30 blur-3xl" />
                            </div>
                            <div className="relative flex flex-col items-center gap-8 text-center lg:flex-row lg:text-left">
                                <div className="flex-1 space-y-4">
                                    <div className="inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs uppercase tracking-[0.3em] text-slate-200">
                                        <Sparkles className="h-4 w-4 text-cyan-300" />
                                        AI triage lab
                                    </div>
                                    <h1 className="text-4xl font-semibold leading-tight md:text-5xl">
                                        {t('title')}
                                    </h1>
                                    <p className="text-lg text-slate-300">
                                        {t('subtitle')}
                                    </p>
                                </div>
                                <div className="grid w-full max-w-md grid-cols-2 gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 text-left text-sm text-slate-200">
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-slate-400">Symptoms logged</p>
                                        <p className="text-3xl font-semibold text-white">{symptoms.length.toString().padStart(2, '0')}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-slate-400">Current severity</p>
                                        <p className="text-xl font-medium text-white">{t(currentSymptom.severity)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-slate-400">Status</p>
                                        <p className="text-base font-medium text-white">
                                            {analysis ? `${analysis.riskLevel.charAt(0).toUpperCase()}${analysis.riskLevel.slice(1)} risk` : 'Awaiting analysis'}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs uppercase tracking-wide text-slate-400">ETA</p>
                                        <p className="text-base font-medium text-white">15-30s</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </FadeIn>

                    <StaggerContainer className="grid gap-8 lg:grid-cols-[minmax(0,1.65fr)_minmax(320px,1fr)]">
                        <div className="space-y-8">
                            <ScaleIn delay={0.2}>
                                <Card className="border-white/10 bg-white/5 text-white backdrop-blur-2xl">
                                    <CardHeader>
                                        <CardTitle className="text-2xl font-semibold">{t('addSymptoms')}</CardTitle>
                                        <CardDescription className="text-slate-300">
                                            Provide detailed context so our models can pattern-match accurately.
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        <div className="grid gap-4 md:grid-cols-2">
                                            <div>
                                                <label className="mb-2 block text-sm font-medium text-slate-200">
                                                    {t('symptomNameLabel')}
                                                </label>
                                                <Input
                                                    type="text"
                                                    placeholder={t('symptomNamePlaceholder')}
                                                    value={currentSymptom.name}
                                                    onChange={(e) => setCurrentSymptom({ ...currentSymptom, name: e.target.value })}
                                                    className="h-12 rounded-2xl border-white/20 bg-white/5 text-white placeholder:text-slate-500"
                                                />
                                            </div>
                                            <div>
                                                <label className="mb-2 block text-sm font-medium text-slate-200">
                                                    {t('durationLabel')}
                                                </label>
                                                <Input
                                                    type="text"
                                                    placeholder={t('durationPlaceholder')}
                                                    value={currentSymptom.duration}
                                                    onChange={(e) => setCurrentSymptom({ ...currentSymptom, duration: e.target.value })}
                                                    className="h-12 rounded-2xl border-white/20 bg-white/5 text-white placeholder:text-slate-500"
                                                />
                                            </div>
                                        </div>

                                        <div>
                                            <div className="mb-3 flex items-center justify-between">
                                                <label className="text-sm font-medium text-slate-200">
                                                    {t('severityLabel')}
                                                </label>
                                                <span className="text-xs text-slate-400">Tap the state that best matches how it feels</span>
                                            </div>
                                            <div className="grid gap-3 sm:grid-cols-3" role="radiogroup" aria-label={t('severityLabel')}>
                                                {[
                                                    { value: 'mild', label: t('mild'), tone: 'from-emerald-400/40 to-emerald-500/10' },
                                                    { value: 'moderate', label: t('moderate'), tone: 'from-amber-400/40 to-orange-500/10' },
                                                    { value: 'severe', label: t('severe'), tone: 'from-rose-500/40 to-red-500/10' }
                                                ].map((option) => (
                                                    <button
                                                        key={option.value}
                                                        type="button"
                                                        role="radio"
                                                        aria-checked={currentSymptom.severity === option.value}
                                                        onClick={() => setCurrentSymptom({ ...currentSymptom, severity: option.value as 'mild' | 'moderate' | 'severe' })}
                                                        className={cn(
                                                            'rounded-2xl border border-white/15 bg-gradient-to-br px-4 py-3 text-left text-sm transition-all hover:border-white/40',
                                                            option.tone,
                                                            currentSymptom.severity === option.value
                                                                ? 'shadow-[0_0_25px_rgba(14,165,233,0.35)] ring-2 ring-cyan-400'
                                                                : 'text-slate-300'
                                                        )}
                                                    >
                                                        <p className="font-semibold text-white">{option.label}</p>
                                                        <p className="text-xs text-slate-200/70">{option.value === 'mild' ? 'Manageable discomfort' : option.value === 'moderate' ? 'Interferes with daily flow' : 'Needs urgent attention'}</p>
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div>
                                            <label className="mb-2 block text-sm font-medium text-slate-200">
                                                {t('detailsLabel')}
                                            </label>
                                            <textarea
                                                rows={4}
                                                placeholder={t('detailsPlaceholder')}
                                                value={currentSymptom.description}
                                                onChange={(e) => setCurrentSymptom({ ...currentSymptom, description: e.target.value })}
                                                className="w-full rounded-2xl border border-white/15 bg-white/5 p-4 text-sm text-white placeholder:text-slate-500 focus:border-cyan-400 focus:outline-none"
                                            />
                                        </div>

                                        <div>
                                            <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">Quick add</p>
                                            <div className="flex flex-wrap gap-2">
                                                {quickSymptomLibrary.map((symptom) => (
                                                    <button
                                                        key={symptom}
                                                        type="button"
                                                        onClick={() => setCurrentSymptom({ ...currentSymptom, name: symptom })}
                                                        className="rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs text-slate-200 transition hover:border-cyan-300 hover:text-white"
                                                    >
                                                        {symptom}
                                                    </button>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-4 sm:flex-row">
                                            <Button
                                                onClick={addSymptom}
                                                className="flex-1 rounded-2xl bg-gradient-to-r from-cyan-400 via-blue-500 to-purple-500 text-base font-medium text-white shadow-[0_20px_60px_rgba(14,165,233,0.25)] hover:shadow-[0_25px_70px_rgba(14,165,233,0.35)]"
                                            >
                                                <Plus className="mr-2 h-4 w-4" />
                                                {t('addSymptomButton')}
                                            </Button>
                                            <Button
                                                type="button"
                                                variant="outline"
                                                onClick={() => {
                                                    setCurrentSymptom({
                                                        name: '',
                                                        severity: 'mild',
                                                        duration: '',
                                                        description: ''
                                                    });
                                                }}
                                                className="rounded-2xl border-white/20 text-slate-200 hover:border-white/40"
                                            >
                                                Reset
                                            </Button>
                                        </div>
                                    </CardContent>
                                </Card>
                            </ScaleIn>

                            {symptoms.length > 0 && (
                                <FadeIn delay={0.35}>
                                    <Card className="border-white/10 bg-slate-950/60 text-white backdrop-blur-2xl">
                                        <CardHeader className="flex-row items-center justify-between">
                                            <div>
                                                <CardTitle className="text-xl font-semibold">
                                                    {t('yourSymptoms')} <span className="text-sm text-slate-400">({symptoms.length})</span>
                                                </CardTitle>
                                            </div>
                                            <Badge className="border-cyan-400/40 bg-cyan-500/10 text-cyan-200">
                                                Real-time log
                                            </Badge>
                                        </CardHeader>
                                        <CardContent className="space-y-4">
                                            <div className="space-y-3">
                                                {symptoms.map((symptom, index) => (
                                                    <div
                                                        key={`${symptom.name}-${index}`}
                                                        className="group relative flex items-start gap-4 rounded-2xl border border-white/10 bg-white/5 p-4"
                                                    >
                                                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-cyan-500/30 to-purple-500/30 text-sm font-semibold text-white">
                                                            {index + 1}
                                                        </div>
                                                        <div className="flex-1 space-y-1">
                                                            <div className="flex flex-wrap items-center gap-2">
                                                                <p className="text-base font-medium text-white">{symptom.name}</p>
                                                                <Badge
                                                                    className={cn(
                                                                        'border-white/20 px-3 py-1 text-xs uppercase tracking-wider',
                                                                        symptom.severity === 'mild' && 'bg-emerald-500/10 text-emerald-200',
                                                                        symptom.severity === 'moderate' && 'bg-amber-400/10 text-amber-200',
                                                                        symptom.severity === 'severe' && 'bg-rose-500/10 text-rose-200'
                                                                    )}
                                                                >
                                                                    {symptom.severity}
                                                                </Badge>
                                                                <span className="text-xs text-slate-400">{symptom.duration}</span>
                                                            </div>
                                                            {symptom.description && (
                                                                <p className="text-sm text-slate-300">{symptom.description}</p>
                                                            )}
                                                        </div>
                                                        <Button
                                                            variant="ghost"
                                                            size="icon"
                                                            onClick={() => removeSymptom(index)}
                                                            className="text-slate-400 transition hover:text-white"
                                                            aria-label={`Remove ${symptom.name}`}
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                ))}
                                            </div>

                                            {error && (
                                                <div className="rounded-2xl border border-rose-400/40 bg-rose-500/10 p-4 text-sm text-rose-200">
                                                    <AlertTriangle className="mr-2 inline h-4 w-4" />
                                                    {error}
                                                </div>
                                            )}

                                            <div className="space-y-3">
                                                <Button
                                                    onClick={handleAnalyze}
                                                    disabled={isAnalyzing}
                                                    className="w-full rounded-2xl bg-gradient-to-r from-emerald-400 via-cyan-400 to-blue-500 text-base font-semibold text-white shadow-[0_10px_50px_rgba(6,182,212,0.35)] disabled:opacity-60"
                                                >
                                                    {isAnalyzing ? (
                                                        <>
                                                            <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-transparent" />
                                                            {t('analyzingButton')}
                                                        </>
                                                    ) : (
                                                        t('analyzeButton')
                                                    )}
                                                </Button>
                                                {isAnalyzing && (
                                                    <div className="rounded-2xl border border-cyan-400/20 bg-cyan-500/10 p-4 text-sm text-cyan-100">
                                                        <div className="flex items-center gap-3">
                                                            <Timer className="h-5 w-5 text-cyan-300" />
                                                            <div>
                                                                <p className="font-medium">Analysis in progress</p>
                                                                <p className="text-xs text-cyan-200/70">This may take up to 30 seconds depending on the complexity of symptoms.</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </FadeIn>
                            )}

                            <FadeIn delay={0.45}>
                                <Card className="border-white/10 bg-slate-950/60 text-white backdrop-blur-2xl">
                                    <CardHeader>
                                        <CardTitle className="flex items-center gap-2 text-xl font-semibold">
                                            <CheckCircle className="h-5 w-5 text-emerald-300" />
                                            {t('resultsTitle')}
                                        </CardTitle>
                                        <CardDescription className="text-slate-400">
                                            {analysis ? 'Latest AI triage summary' : 'Run an analysis to unlock your personalized triage summary.'}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="space-y-6">
                                        {analysis ? (
                                            <>
                                                <div className="grid gap-4 md:grid-cols-2">
                                                    <div
                                                        className={cn(
                                                            'rounded-2xl border border-white/10 bg-gradient-to-br p-4 text-sm text-white',
                                                            analysis ? riskPalette[analysis.riskLevel.toLowerCase()] ?? 'from-slate-600/30 to-slate-900/30' : ''
                                                        )}
                                                    >
                                                        <p className="text-xs uppercase tracking-wide text-white/70">{t('riskAssessment')}</p>
                                                        <div className="mt-2 flex items-center gap-2 text-lg font-semibold">
                                                            <AlertTriangle className="h-5 w-5" />
                                                            {analysis.riskLevel.charAt(0).toUpperCase() + analysis.riskLevel.slice(1)}
                                                        </div>
                                                    </div>
                                                    <div
                                                        className={cn(
                                                            'rounded-2xl border border-white/10 bg-gradient-to-br p-4 text-sm text-white',
                                                            urgencyPalette[analysis.urgency.toLowerCase()] ?? 'from-slate-600/30 to-slate-900/30'
                                                        )}
                                                    >
                                                        <p className="text-xs uppercase tracking-wide text-white/70">{t('urgencyLevel')}</p>
                                                        <div className="mt-2 flex items-center gap-2 text-lg font-semibold">
                                                            <ShieldAlert className="h-5 w-5" />
                                                            {analysis.urgency.charAt(0).toUpperCase() + analysis.urgency.slice(1)}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div>
                                                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-200">{t('recommendations')}</h3>
                                                    <ul className="mt-3 space-y-2">
                                                        {analysis.recommendations.map((rec, index) => (
                                                            <li key={`${rec}-${index}`} className="flex items-start gap-3 rounded-2xl border border-white/5 bg-white/5 p-3 text-sm text-slate-200">
                                                                <CheckCircle className="mt-0.5 h-4 w-4 text-emerald-300" />
                                                                {rec}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                <div>
                                                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-200">{t('possibleConditions')}</h3>
                                                    {analysis.possibleConditions?.length ? (
                                                        <div className="mt-3 space-y-3">
                                                            {analysis.possibleConditions.map((condition, index) => (
                                                                <div
                                                                    key={`${condition.condition}-${index}`}
                                                                    className="rounded-2xl border border-white/10 bg-white/5 p-4"
                                                                >
                                                                    <div className="flex items-center justify-between text-sm text-slate-200">
                                                                        <p className="font-medium text-white">{condition.condition}</p>
                                                                        <span className="text-xs text-slate-300">{condition.probability}% likelihood</span>
                                                                    </div>
                                                                    <p className="mt-2 text-sm text-slate-300">{condition.description}</p>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <p className="mt-3 rounded-2xl border border-white/5 bg-white/5 p-4 text-sm text-slate-300">
                                                            Unable to determine specific conditions. Please consult a healthcare professional for proper diagnosis.
                                                        </p>
                                                    )}
                                                </div>

                                                {analysis.followUpIn && (
                                                    <div className="rounded-2xl border border-cyan-300/30 bg-cyan-500/10 p-4 text-sm text-cyan-100">
                                                        <p className="text-xs uppercase tracking-wide text-cyan-200/70">{t('followUpRecommendation')}</p>
                                                        <p className="mt-1 text-base text-white">
                                                            {t('followUpPrefixText')} <strong>{analysis.followUpIn}</strong>
                                                        </p>
                                                    </div>
                                                )}

                                                <div className="rounded-2xl border border-amber-300/30 bg-amber-500/10 p-4 text-sm text-amber-100">
                                                    <div className="flex items-start gap-3">
                                                        <AlertTriangle className="h-5 w-5 text-amber-200" />
                                                        <div>
                                                            {t('disclaimer')}
                                                            {analysis.telemetry?.fallbackUsed && (
                                                                <p className="mt-1 text-xs text-amber-200/70">
                                                                    Note: This analysis used our fallback system. Try again soon for the latest model run.
                                                                </p>
                                                            )}
                                                            {analysis.telemetry?.cached && (
                                                                <p className="mt-1 text-xs text-emerald-200/70">
                                                                    Delivered via cache for faster turn-around.
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                <div className="flex flex-col gap-3 sm:flex-row">
                                                    <Button
                                                        variant="outline"
                                                        className="flex-1 rounded-2xl border-white/20 text-slate-100 hover:border-white/50"
                                                        onClick={async () => {
                                                            try {
                                                                const response = await fetch('/api/symptom-check/save', {
                                                                    method: 'POST',
                                                                    headers: { 'Content-Type': 'application/json' },
                                                                    credentials: 'include',
                                                                    body: JSON.stringify({
                                                                        symptoms,
                                                                        analysis,
                                                                        date: new Date().toISOString()
                                                                    })
                                                                });

                                                                if (response.ok) {
                                                                    success(t('resultsSaved') || 'Analysis saved successfully');
                                                                    return;
                                                                }

                                                                let errMsg = 'Failed to save results';
                                                                try {
                                                                    const data = await response.json();
                                                                    if (data?.error) errMsg = String(data.error);
                                                                } catch {
                                                                    // no-op
                                                                }

                                                                if (response.status === 401) {
                                                                    showError(t('authRequired') || 'Please sign in to save results.');
                                                                    const callbackUrl = encodeURIComponent(pathname || '/');
                                                                    router.push(`/auth/signin?callbackUrl=${callbackUrl}`);
                                                                    return;
                                                                }

                                                                throw new Error(errMsg);
                                                            } catch (error) {
                                                                console.error('Error saving results:', error);
                                                                showError(t('savingError') || 'Failed to save results. Please try again.');
                                                            }
                                                        }}
                                                    >
                                                        {t('saveResults')}
                                                    </Button>
                                                </div>

                                                <EmergencyContact
                                                    analysis={analysis}
                                                    symptoms={symptoms.map((s) => s.name)}
                                                    showForm={showEmergencyForm}
                                                    onClose={() => setShowEmergencyForm(false)}
                                                />
                                            </>
                                        ) : (
                                            <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 p-6 text-center text-sm text-slate-300">
                                                <p>AI insights will appear here after you add symptoms and tap analyze.</p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Card>
                            </FadeIn>
                        </div>

                        <div className="space-y-8">
                            <Card className="border-white/10 bg-white/5 text-white backdrop-blur-2xl">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                                        <ShieldAlert className="h-5 w-5 text-cyan-300" />
                                        Session status
                                    </CardTitle>
                                    <CardDescription className="text-slate-300">
                                        Live preview of your triage workflow.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                            <p className="text-xs uppercase tracking-wide text-slate-400">Symptoms logged</p>
                                            <p className="mt-2 text-2xl font-semibold text-white">{symptoms.length}</p>
                                        </div>
                                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                            <p className="text-xs uppercase tracking-wide text-slate-400">Phase</p>
                                            <p className="mt-2 text-base text-white">{activePhaseLabel}</p>
                                        </div>
                                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                            <p className="text-xs uppercase tracking-wide text-slate-400">Urgency</p>
                                            <p className="mt-2 text-base text-white">{analysis ? formatLabel(analysis.urgency) : 'Pending'}</p>
                                        </div>
                                        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                                            <p className="text-xs uppercase tracking-wide text-slate-400">Risk</p>
                                            <p className="mt-2 text-base text-white">{analysis ? formatLabel(analysis.riskLevel) : 'Pending'}</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-white/10 bg-slate-950/60 text-white backdrop-blur-2xl">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                                        <Activity className="h-5 w-5 text-emerald-300" />
                                        Care timeline
                                    </CardTitle>
                                    <CardDescription className="text-slate-400">
                                        Where you are in the triage runway.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {carePhases.map((phase, index) => {
                                        const Icon = phase.icon;
                                        const isComplete = index < stageIndex;
                                        const isActive = index === stageIndex;

                                        return (
                                            <div
                                                key={phase.title}
                                                className={cn(
                                                    'flex items-start gap-4 rounded-2xl border p-4',
                                                    isComplete ? 'border-emerald-400/40 bg-emerald-400/5' : isActive ? 'border-cyan-400/40 bg-cyan-500/5' : 'border-white/10 bg-white/5'
                                                )}
                                            >
                                                <div className="mt-1 rounded-2xl bg-white/10 p-2">
                                                    <Icon className="h-5 w-5 text-cyan-200" />
                                                </div>
                                                <div className="space-y-1">
                                                    <p className="text-sm font-semibold text-white">{phase.title}</p>
                                                    <p className="text-sm text-slate-300">{phase.description}</p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </CardContent>
                            </Card>

                            <Card className="border-white/10 bg-white/5 text-white backdrop-blur-2xl">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg font-semibold">
                                        <HeartPulse className="h-5 w-5 text-rose-300" />
                                        Calm guidance
                                    </CardTitle>
                                    <CardDescription className="text-slate-300">
                                        Small moves that help while you wait.
                                    </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm text-slate-200">
                                    {reassuranceTips.map((tip) => (
                                        <div key={tip} className="rounded-2xl border border-white/10 bg-white/5 p-3">
                                            {tip}
                                        </div>
                                    ))}
                                </CardContent>
                            </Card>
                        </div>
                    </StaggerContainer>
                </div>
            </div>
        </div>
    );
}
