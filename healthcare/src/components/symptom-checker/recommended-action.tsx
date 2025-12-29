'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ExternalLink, Calendar, AlertTriangle, CheckCircle, Clock } from 'lucide-react';
import { Link } from '@/navigation';
import { type AIAnalysis } from '@/lib/ai/symptom-analyzer';
import { type SymptomInput } from '@/lib/ai/symptom-analyzer';

interface RecommendedActionProps {
    analysis: AIAnalysis;
    symptoms: SymptomInput[] | string[];
}

export function RecommendedAction({ analysis, symptoms }: RecommendedActionProps) {
    const t = useTranslations('SymptomChecker');
    const router = useRouter();
    const [isBooking, setIsBooking] = useState(false);
    const [bookingResult, setBookingResult] = useState<{ success?: boolean; error?: string } | null>(null);

    // Determine the recommended action based on risk level and urgency
    const isEmergency = analysis.urgency === 'emergency' || analysis.riskLevel === 'critical';
    const isUrgent = analysis.urgency === 'urgent' || analysis.riskLevel === 'high';

    // Format symptoms for consultation
    const symptomsSummary = Array.isArray(symptoms)
        ? symptoms.map(s => typeof s === 'string' ? s : s.name).join(', ')
        : '';

    const handleBookConsultation = async () => {
        setIsBooking(true);
        setBookingResult(null);

        try {
            // Get suggested time based on urgency
            const suggestedTime = getSuggestedTime(analysis.urgency, analysis.riskLevel);

            // Prepare consultation data
            const consultationData = {
                reason: `AI Triage: ${analysis.riskLevel} risk - ${symptomsSummary}`,
                date: suggestedTime.date,
                time: suggestedTime.time,
                type: 'video',
                fromAITriage: true,
                urgency: analysis.urgency,
                riskLevel: analysis.riskLevel
            };

            // Send to API
            const response = await fetch('/api/consultations', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(consultationData),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to book consultation');
            }

            setBookingResult({ success: true });

            // Redirect to consultations page after successful booking
            setTimeout(() => {
                router.push('/consultations');
            }, 2000);

        } catch (error) {
            console.error('Error booking urgent consultation:', error);
            setBookingResult({
                error: error instanceof Error ? error.message : 'Failed to book consultation'
            });
        } finally {
            setIsBooking(false);
        }
    };

    // Get suggested appointment time based on urgency
    const getSuggestedTime = (urgency: string, riskLevel: string) => {
        const now = new Date();
        const targetDate = new Date(now);

        // Set time based on urgency
        if (urgency === 'emergency' || riskLevel === 'critical') {
            // Immediate - next available slot today
            targetDate.setHours(now.getHours() + 1);
        } else if (urgency === 'urgent' || riskLevel === 'high') {
            // Same day or next day
            if (now.getHours() >= 16) { // If after 4 PM, schedule for tomorrow
                targetDate.setDate(now.getDate() + 1);
                targetDate.setHours(9, 0, 0, 0);
            } else {
                // Later today
                targetDate.setHours(now.getHours() + 3);
            }
        } else if (riskLevel === 'medium') {
            // Within 2-3 days
            targetDate.setDate(now.getDate() + 2);
            targetDate.setHours(10, 0, 0, 0);
        } else {
            // Low risk - within a week
            targetDate.setDate(now.getDate() + 5);
            targetDate.setHours(14, 0, 0, 0);
        }

        // Format date and time for the form
        const dateStr = targetDate.toISOString().split('T')[0];
        const timeStr = `${String(targetDate.getHours()).padStart(2, '0')}:${String(targetDate.getMinutes()).padStart(2, '0')}`;

        return { date: dateStr, time: timeStr };
    };

    if (isEmergency) {
        return (
            <Card className="border-red-500 bg-red-50 mb-6">
                <CardHeader className="pb-2">
                    <CardTitle className="text-red-700 flex items-center">
                        <AlertTriangle className="h-5 w-5 mr-2" />
                        {t('emergencyAction')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="mb-4 text-red-700">
                        {t('emergencyActionDescription')}
                    </p>
                    <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                        <Button className="bg-red-600 hover:bg-red-700">
                            <ExternalLink className="h-4 w-4 mr-2" />
                            {t('callEmergencyServices')}
                        </Button>
                        <Link href="/consultations" passHref>
                            <Button variant="outline" className="border-red-500 text-red-700">
                                <Calendar className="h-4 w-4 mr-2" />
                                {t('requestUrgentConsultation')}
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (isUrgent) {
        return (
            <Card className="border-orange-500 bg-orange-50 mb-6">
                <CardHeader className="pb-2">
                    <CardTitle className="text-orange-700 flex items-center">
                        <Clock className="h-5 w-5 mr-2" />
                        {t('urgentAction')}
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="mb-4 text-orange-700">
                        {t('urgentActionDescription')}
                    </p>

                    {bookingResult?.success ? (
                        <div className="p-3 bg-green-100 text-green-800 rounded-md flex items-center mb-4">
                            <CheckCircle className="h-5 w-5 mr-2" />
                            {t('consultationBookedSuccess')}
                        </div>
                    ) : bookingResult?.error ? (
                        <div className="p-3 bg-red-100 text-red-800 rounded-md mb-4">
                            {t('consultationBookingError', { error: bookingResult.error })}
                        </div>
                    ) : null}

                    <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                        <Button
                            onClick={handleBookConsultation}
                            disabled={isBooking || bookingResult?.success}
                            className="bg-orange-600 hover:bg-orange-700"
                        >
                            {isBooking ? (
                                <>
                                    <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                    {t('bookingUrgentConsultation')}
                                </>
                            ) : (
                                <>
                                    <Calendar className="h-4 w-4 mr-2" />
                                    {t('bookUrgentConsultation')}
                                </>
                            )}
                        </Button>
                        <Link href="/consultations" passHref>
                            <Button variant="outline" className="border-orange-500 text-orange-700">
                                <Calendar className="h-4 w-4 mr-2" />
                                {t('customizeAppointment')}
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        );
    }

    // Medium or low risk
    return (
        <Card className={`${analysis.riskLevel === 'medium' ? 'border-yellow-500 bg-yellow-50' : 'border-green-500 bg-green-50'} mb-6`}>
            <CardHeader className="pb-2">
                <CardTitle className={`${analysis.riskLevel === 'medium' ? 'text-yellow-700' : 'text-green-700'} flex items-center`}>
                    <Clock className="h-5 w-5 mr-2" />
                    {analysis.riskLevel === 'medium' ? t('moderateAction') : t('lowRiskAction')}
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className={`mb-4 ${analysis.riskLevel === 'medium' ? 'text-yellow-700' : 'text-green-700'}`}>
                    {analysis.riskLevel === 'medium' ? t('moderateActionDescription') : t('lowRiskActionDescription')}
                </p>

                {bookingResult?.success ? (
                    <div className="p-3 bg-green-100 text-green-800 rounded-md flex items-center mb-4">
                        <CheckCircle className="h-5 w-5 mr-2" />
                        {t('consultationBookedSuccess')}
                    </div>
                ) : bookingResult?.error ? (
                    <div className="p-3 bg-red-100 text-red-800 rounded-md mb-4">
                        {t('consultationBookingError', { error: bookingResult.error })}
                    </div>
                ) : null}

                <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
                    <Button
                        onClick={handleBookConsultation}
                        disabled={isBooking || bookingResult?.success}
                        className={`${analysis.riskLevel === 'medium' ? 'bg-yellow-600 hover:bg-yellow-700' : 'bg-green-600 hover:bg-green-700'}`}
                    >
                        {isBooking ? (
                            <>
                                <div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                                {t('bookingConsultation')}
                            </>
                        ) : (
                            <>
                                <Calendar className="h-4 w-4 mr-2" />
                                {t('bookRecommendedConsultation')}
                            </>
                        )}
                    </Button>
                    <Link href="/consultations" passHref>
                        <Button variant="outline" className={`${analysis.riskLevel === 'medium' ? 'border-yellow-500 text-yellow-700' : 'border-green-500 text-green-700'}`}>
                            <Calendar className="h-4 w-4 mr-2" />
                            {t('customizeAppointment')}
                        </Button>
                    </Link>
                </div>
            </CardContent>
        </Card>
    );
}
