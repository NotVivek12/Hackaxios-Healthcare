'use client';

import { useTranslations } from 'next-intl';
import ConsultationForm from '@/components/consultations/consultation-form';

export default function NewConsultationPage() {
    const t = useTranslations('Consultations');

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800 py-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('bookConsultation')}</h1>
                    <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">{t('subtitle')}</p>
                </div>

                <ConsultationForm />
            </div>
        </div>
    );
}
