'use client';

import { useState, FormEvent } from 'react';
import { useTranslations } from 'next-intl';
import { useSession } from 'next-auth/react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface SmsFormData {
    phoneNumber: string;
    message: string;
}

export default function SMSSupport() {
    const t = useTranslations('SmsSupport');
    const { data: session } = useSession();
    const [formData, setFormData] = useState<SmsFormData>({ phoneNumber: '', message: '' });
    const [isLoading, setIsLoading] = useState(false);
    const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null);
    const [selectedTemplate, setSelectedTemplate] = useState<string>('');

    const messageTemplates = [
        { id: 'symptoms', text: t('templates.symptoms') },
        { id: 'medication', text: t('templates.medication') },
        { id: 'appointment', text: t('templates.appointment') },
    ];

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const applyTemplate = (templateId: string) => {
        setSelectedTemplate(templateId);

        let templateText = '';
        switch (templateId) {
            case 'symptoms':
                templateText = t('templateText.symptoms');
                break;
            case 'medication':
                templateText = t('templateText.medication');
                break;
            case 'appointment':
                templateText = t('templateText.appointment');
                break;
        }

        setFormData((prev) => ({ ...prev, message: templateText }));
    };

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setResult(null);

        try {
            const response = await fetch('/api/sms', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    phoneNumber: formData.phoneNumber,
                    content: formData.message,
                    messageType: 'general',
                    recipientName: session?.user?.name || undefined,
                }),
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to send SMS');
            }

            setResult({ success: true });
            // Clear form after successful submission
            setFormData({ phoneNumber: '', message: '' });
            setSelectedTemplate('');

        } catch (error) {
            setResult({ error: error instanceof Error ? error.message : 'Unknown error occurred' });
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container mx-auto py-8 px-4">
            <div className="max-w-3xl mx-auto">
                <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
                <p className="text-gray-600 mb-8">{t('subtitle')}</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="col-span-2">
                        <CardHeader>
                            <CardTitle>{t('sendSmsTitle')}</CardTitle>
                            <CardDescription>{t('sendSmsDescription')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('phoneNumberLabel')}
                                    </label>
                                    <Input
                                        id="phoneNumber"
                                        name="phoneNumber"
                                        type="tel"
                                        placeholder={t('phoneNumberPlaceholder')}
                                        value={formData.phoneNumber}
                                        onChange={handleInputChange}
                                        required
                                    />
                                    <p className="text-xs text-gray-500 mt-1">{t('phoneNumberHelp')}</p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('messageTemplates')}
                                    </label>
                                    <div className="flex flex-wrap gap-2 mb-3">
                                        {messageTemplates.map((template) => (
                                            <button
                                                key={template.id}
                                                type="button"
                                                className={`px-3 py-1 text-sm rounded-full ${selectedTemplate === template.id
                                                    ? 'bg-blue-600 text-white'
                                                    : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                                                    }`}
                                                onClick={() => applyTemplate(template.id)}
                                            >
                                                {template.text}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div>
                                    <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
                                        {t('messageLabel')}
                                    </label>
                                    <textarea
                                        id="message"
                                        name="message"
                                        rows={4}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        placeholder={t('messagePlaceholder')}
                                        value={formData.message}
                                        onChange={handleInputChange}
                                        required
                                    ></textarea>
                                </div>

                                {result && (
                                    <div
                                        className={`p-3 rounded-md ${result.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                                            }`}
                                    >
                                        {result.success
                                            ? t('successMessage')
                                            : t('errorMessage', { error: result.error || 'Unknown error' })}
                                    </div>
                                )}

                                <Button type="submit" disabled={isLoading} className="w-full">
                                    {isLoading ? t('sending') : t('sendButton')}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>{t('howItWorksTitle')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ul className="space-y-3 text-sm">
                                <li className="flex gap-2">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                        1
                                    </span>
                                    <span>{t('howItWorks.step1')}</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                        2
                                    </span>
                                    <span>{t('howItWorks.step2')}</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                        3
                                    </span>
                                    <span>{t('howItWorks.step3')}</span>
                                </li>
                                <li className="flex gap-2">
                                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center">
                                        4
                                    </span>
                                    <span>{t('howItWorks.step4')}</span>
                                </li>
                            </ul>
                            <div className="mt-4 pt-4 border-t border-gray-200">
                                <h3 className="font-medium text-sm mb-2">{t('supportedRegions')}</h3>
                                <p className="text-sm text-gray-600">{t('regionsDescription')}</p>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('faqTitle')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div>
                                <h3 className="font-medium mb-1">{t('faq.q1')}</h3>
                                <p className="text-sm text-gray-600">{t('faq.a1')}</p>
                            </div>
                            <div>
                                <h3 className="font-medium mb-1">{t('faq.q2')}</h3>
                                <p className="text-sm text-gray-600">{t('faq.a2')}</p>
                            </div>
                            <div>
                                <h3 className="font-medium mb-1">{t('faq.q3')}</h3>
                                <p className="text-sm text-gray-600">{t('faq.a3')}</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
