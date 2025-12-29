import { NextIntlClientProvider } from 'next-intl';
import { getMessages, getLocale } from 'next-intl/server';
import type { ReactNode } from 'react';
import AuthProvider from '@/components/providers/session-provider';
import '../globals.css';
import { Inter } from 'next/font/google';
import ClientHeaderWrapper from '@/components/layout/client-header-wrapper';
import LocalePersistence from '@/components/locale-persistence';
import { ThemeProvider } from '@/components/providers/theme-provider';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });

export async function generateMetadata() {
    return {
        title: {
            default: "AI-HealthCare",
            template: "%s | AI-HealthCare",
        },
        description: "AI-powered healthcare platform with symptom checking, telemedicine, and multilingual support.",
        metadataBase: new URL('https://ai-healthcare.vercel.app'),
    };
}

export default async function LocaleLayout({
    children
}: {
    children: ReactNode;
}) {
    const locale = await getLocale();
    const messages = await getMessages();

    // Nested layout: don't render <html>/<body> here; the root layout does that
    return (
        <NextIntlClientProvider locale={locale} messages={messages}>
            <LocalePersistence />
            <ThemeProvider>
                {/* Disable the full-screen loading overlay on auth pages to avoid perceived "stuck" UI */}
                <AuthProvider disableOverlay>
                    <div className={`${inter.variable} font-sans relative flex min-h-screen flex-col antialiased`}>
                        <ClientHeaderWrapper />
                        <main className="flex-1">
                            {children}
                        </main>
                    </div>
                </AuthProvider>
            </ThemeProvider>
        </NextIntlClientProvider>
    );
}
