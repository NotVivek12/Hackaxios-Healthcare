import { useState, useEffect } from 'react';
import { Phone, AlertTriangle, CheckCircle } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import type { AIAnalysis } from '@/lib/ai/symptom-analyzer';

interface EmergencyContactProps {
    analysis: AIAnalysis;
    symptoms: string[];
    showForm?: boolean;
    onClose?: () => void;
}

export function EmergencyContact({ analysis, symptoms, showForm, onClose }: EmergencyContactProps) {
    const t = useTranslations('SymptomChecker');
    const [showEmergencyForm, setShowEmergencyForm] = useState(false);
    const [emergencyContact, setEmergencyContact] = useState({ name: '', phone: '' });
    const [emergencyContactSent, setEmergencyContactSent] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Sync the internal state with the prop if provided
    useEffect(() => {
        if (showForm !== undefined) {
            setShowEmergencyForm(showForm);
        }
    }, [showForm]);

    // Only show for critical or emergency cases
    if (analysis.riskLevel !== 'critical' && analysis.urgency !== 'emergency') {
        return null;
    }

    const handleEmergencyContact = async (e: React.FormEvent) => {
        e.preventDefault();

        // Reset error state first
        setError(null);

        if (!emergencyContact.name || !emergencyContact.phone) {
            setError(t('emergencyContact.validationError'));
            return;
        }

        try {
            // Create emergency SMS alert
            const response = await fetch('/api/sms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    messageType: 'alert',
                    phoneNumber: emergencyContact.phone,
                    recipientName: emergencyContact.name,
                    content: `MEDICAL ALERT: ${symptoms.join(', ')}. Please seek medical attention immediately.`
                }),
            });

            if (!response.ok) {
                throw new Error('Failed to send emergency contact message');
            }

            setEmergencyContactSent(true);
            // Auto-hide the form after success
            setTimeout(() => {
                setShowEmergencyForm(false);
                setEmergencyContactSent(false);
            }, 5000);
        } catch (error) {
            console.error('Error sending emergency contact:', error);
            setError(t('emergencyContact.errorMessage'));
        }
    };

    return (
        <div className="mt-6">
            <div className={showEmergencyForm ? "hidden" : "block"}>
                <Button
                    variant="destructive"
                    className="flex w-full items-center justify-center rounded-2xl border-0 bg-gradient-to-r from-rose-500 via-orange-500 to-amber-400 text-white shadow-[0_20px_60px_rgba(249,115,22,0.35)]"
                    onClick={() => setShowEmergencyForm(true)}
                >
                    <Phone className="mr-2 h-4 w-4" />
                    {t('emergencyContact.title')}
                </Button>
            </div>

            {showEmergencyForm && (
                <div className="mt-3 space-y-4 rounded-2xl border border-rose-400/40 bg-rose-500/10 p-5 text-rose-50">
                    {emergencyContactSent ? (
                        <div className="flex items-center text-emerald-200">
                            <CheckCircle className="mr-2 h-5 w-5" />
                            <span>{t('emergencyContact.successMessage')}</span>
                        </div>
                    ) : (
                        <>
                            <h4 className="flex items-center text-base font-medium text-rose-100">
                                <AlertTriangle className="mr-2 h-5 w-5 text-amber-300" />
                                {t('emergencyContact.title')}
                            </h4>
                            <form onSubmit={handleEmergencyContact} className="space-y-3" data-testid="emergency-form">
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-rose-100">
                                        {t('emergencyContact.nameLabel')}
                                    </label>
                                    <Input
                                        type="text"
                                        placeholder={t('emergencyContact.namePlaceholder')}
                                        value={emergencyContact.name}
                                        onChange={(e) => setEmergencyContact({
                                            ...emergencyContact,
                                            name: e.target.value
                                        })}
                                        required
                                        className="h-11 rounded-2xl border-white/20 bg-white/5 text-white placeholder:text-rose-200/70"
                                    />
                                </div>
                                <div>
                                    <label className="mb-1 block text-sm font-medium text-rose-100">
                                        {t('emergencyContact.phoneLabel')}
                                    </label>
                                    <Input
                                        type="tel"
                                        placeholder={t('emergencyContact.phonePlaceholder')}
                                        value={emergencyContact.phone}
                                        onChange={(e) => setEmergencyContact({
                                            ...emergencyContact,
                                            phone: e.target.value
                                        })}
                                        required
                                        className="h-11 rounded-2xl border-white/20 bg-white/5 text-white placeholder:text-rose-200/70"
                                    />
                                    <p className="mt-1 text-xs text-rose-200/80">
                                        {t('emergencyContact.phoneHelp')}
                                    </p>
                                </div>
                                {error && (
                                    <div className="text-sm text-amber-200" role="alert">
                                        {error}
                                    </div>
                                )}
                                <div className="flex flex-row gap-2">
                                    <Button
                                        type="submit"
                                        variant="destructive"
                                        className="flex-1 rounded-2xl border-0 bg-gradient-to-r from-rose-500 to-orange-400"
                                    >
                                        {t('emergencyContact.sendAlert')}
                                    </Button>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="flex-1 rounded-2xl border-white/30 text-white hover:border-white/60"
                                        onClick={() => {
                                            setShowEmergencyForm(false);
                                            if (onClose) onClose();
                                        }}
                                    >
                                        {t('emergencyContact.cancel')}
                                    </Button>
                                </div>
                            </form>
                        </>
                    )}
                </div>
            )}
        </div>
    );
}
