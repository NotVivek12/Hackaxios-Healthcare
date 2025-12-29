import { getTranslations } from 'next-intl/server';
import { Link } from '@/navigation';
import { Stethoscope, Video, MessageSquare, BarChart3, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
// Removed ParticlesBackground to reduce bundle size on homepage
import { FadeIn, StaggerContainer, StaggerItem } from '@/components/animations/motion-effects';
import AuroraBackground from '@/components/landing/AuroraBackground';
import PortalHero from '@/components/landing/PortalHero';
import AuroraSurface from '@/components/landing/AuroraSurface';
import PrismCard from '@/components/landing/PrismCard';
import PulseStat from '@/components/landing/PulseStat';

export default async function HomePage() {
    const t = await getTranslations('Home');

    const features = [
        {
            icon: Stethoscope,
            title: t('features.symptomChecker.title'),
            description: t('features.symptomChecker.description'),
            href: '/symptom-checker',
        },
        {
            icon: Video,
            title: t('features.telemedicine.title'),
            description: t('features.telemedicine.description'),
            href: '/consultations',
        },
        {
            icon: MessageSquare,
            title: t('features.smsSupport.title'),
            description: t('features.smsSupport.description'),
            href: '/sms-support',
        },
        {
            icon: BarChart3,
            title: t('features.analytics.title'),
            description: t('features.analytics.description'),
            href: '/analytics',
        },
    ];

    return (
        <div className="relative min-h-screen overflow-hidden bg-background text-foreground transition-colors dark:bg-[#030613] dark:text-white">
            <AuroraBackground className="absolute inset-0 -z-20 opacity-25 dark:opacity-100" intensity={0.55} />
            <div className="grain-overlay absolute inset-0 -z-10 opacity-[0.08] dark:opacity-100" aria-hidden />
            <PortalHero
                title={t('hero.title')}
                subtitle={t('hero.subtitle')}
                primaryHref="/symptom-checker"
                primaryLabel={t('hero.cta.primary')}
                secondaryHref="/consultations"
                secondaryLabel={t('hero.cta.secondary')}
            />

            {/* Nebula Capabilities */}
            <section className="relative z-10 px-4 py-24 sm:px-6 lg:px-10">
                <div className="mx-auto max-w-6xl">
                    <div className="mb-12 text-center">
                        <p className="text-sm uppercase tracking-[0.4em] text-slate-500 dark:text-white/60">{t('features.subtitle')}</p>
                        <h2 className="headline-xl bg-gradient-to-r from-slate-900 via-slate-600 to-purple-600 bg-clip-text text-transparent dark:from-cyan-200 dark:via-white dark:to-purple-200">
                            {t('features.title')}
                        </h2>
                    </div>
                    <StaggerContainer className="grid gap-8 md:grid-cols-2">
                        {features.map((feature) => (
                            <StaggerItem key={feature.title}>
                                <PrismCard
                                    title={feature.title}
                                    description={feature.description}
                                    icon={<feature.icon className="h-6 w-6" />}
                                    href={feature.href}
                                />
                            </StaggerItem>
                        ))}
                    </StaggerContainer>
                </div>
            </section>

            {/* Trust Nebula */}
            <section className="relative px-4 py-24 sm:px-6 lg:px-10">
                <div className="mx-auto max-w-6xl">
                    <AuroraSurface variant="pulse" interactive>
                        <div className="grid gap-10 lg:grid-cols-2">
                            <div>
                                <p className="text-sm uppercase tracking-[0.4em] text-slate-500 dark:text-white/60">Trusted Orbit</p>
                                <h3 className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">Loved by providers & patients</h3>
                                <p className="mt-4 text-slate-600 dark:text-white/70">
                                    From remote villages to research hospitals, AI-HealthCare orchestrates personalized care with empathy, multilingual support, and lightning-fast diagnostics.
                                </p>
                                <div className="mt-8 flex flex-wrap gap-4 text-sm text-slate-600 dark:text-white/70">
                                    {["HIPAA", "SOC2", "ISO27001", "FHIR-native"].map((badge) => (
                                        <span key={badge} className="rounded-full border border-slate-300 px-4 py-1 dark:border-white/20">
                                            {badge}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            <div className="grid gap-6 sm:grid-cols-2">
                                <PulseStat value={24} suffix="/7" label={t('stats.availability')} />
                                <PulseStat value={10} suffix="+" label={t('stats.languages')} gradient={["#FF5F9E", "#FFD6E8"]} />
                                <PulseStat value={100} suffix="%" label={t('stats.secure')} gradient={["#80FFEA", "#53F6FF"]} />
                                <PulseStat value={4.9} suffix="★" label={t('hero.cta.secondary')} gradient={["#FDE68A", "#F97316"]} />
                            </div>
                        </div>
                    </AuroraSurface>
                </div>
            </section>

            {/* Intelligence Grid */}
            <section className="relative px-4 py-24 sm:px-6 lg:px-10">
                <div className="mx-auto max-w-6xl">
                    <StaggerContainer className="grid gap-8 lg:grid-cols-[1.2fr,0.8fr]">
                        <StaggerItem>
                            <div className="rounded-3xl bg-gradient-to-br from-slate-100 to-transparent p-8 text-slate-900 backdrop-blur-xl dark:from-white/10 dark:text-white">
                                <div className="flex items-center gap-3 text-sm uppercase tracking-[0.4em] text-slate-500 dark:text-white/60">
                                    <Sparkles className="h-4 w-4" />
                                    AI Symptom Intelligence
                                </div>
                                <h3 className="mt-4 text-3xl font-semibold text-slate-900 dark:text-white">Real-time diagnostic guidance</h3>
                                <p className="mt-4 text-slate-600 dark:text-white/70">
                                    Our multilingual AI synthesizes 50k+ clinical pathways, vitals, and context to map each patient to the most relevant provider in seconds.
                                </p>
                                <div className="mt-8 grid gap-4 md:grid-cols-2">
                                    {[
                                        'Predictive triage',
                                        'Smart follow-ups',
                                        'Vitals integration',
                                        'Secure consent',
                                    ].map((item: string) => (
                                        <div
                                            key={item}
                                            className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-slate-700 dark:border-white/10 dark:bg-white/5 dark:text-white/80"
                                        >
                                            {item}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </StaggerItem>
                        <StaggerItem>
                            <div className="rounded-3xl border border-slate-200 bg-white p-6 text-slate-900 backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 dark:text-white">
                                <h4 className="text-lg font-semibold">Live Health Stream</h4>
                                <div className="mt-6 space-y-4">
                                    {[
                                        'Respiratory comfort rising',
                                        'Hydration on track',
                                        'Glucose stabilized',
                                    ].map((line: string, idx: number) => (
                                        <div key={line} className="rounded-2xl border border-slate-200 bg-white p-4 dark:border-white/10 dark:bg-white/5">
                                            <p className="text-sm uppercase tracking-[0.3em] text-slate-500 dark:text-white/50">Signal {idx + 1}</p>
                                            <p className="text-slate-900 dark:text-white/90">{line}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </StaggerItem>
                    </StaggerContainer>
                </div>
            </section>

            {/* CTA Portal */}
            <section className="relative px-4 py-24 sm:px-6 lg:px-10">
                <div className="mx-auto max-w-4xl text-center">
                    <FadeIn>
                        <h2 className="headline-xl bg-gradient-to-r from-slate-900 via-slate-600 to-purple-600 bg-clip-text text-transparent dark:from-cyan-200 dark:via-white dark:to-purple-200">
                            {t('cta.title')}
                        </h2>
                        <p className="subhead-lg mt-4 text-slate-600 dark:text-white/70">{t('cta.subtitle')}</p>
                        <div className="mt-10 flex flex-wrap justify-center gap-4">
                            <Button variant="gradient" size="lg" glow animated asChild>
                                <Link href="/get-started">{t('cta.button')}</Link>
                            </Button>
                            <Button variant="outline" size="lg" animated className="border-slate-300 text-slate-700 hover:bg-slate-100 dark:border-white/40 dark:text-white dark:hover:bg-white/10" asChild>
                                <Link href="/consultations">{t('hero.cta.secondary')}</Link>
                            </Button>
                        </div>
                    </FadeIn>
                </div>
            </section>
        </div>
    );
}