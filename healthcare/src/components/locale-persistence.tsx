'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from '@/navigation';
import { useLocale } from 'next-intl';

const SUPPORTED_LOCALES = ['en', 'es', 'fr', 'hi', 'pt', 'sw', 'ar'] as const;
type SupportedLocale = typeof SUPPORTED_LOCALES[number];

const isSupportedLocale = (value: string | null | undefined): value is SupportedLocale => {
    if (!value) return false;
    return SUPPORTED_LOCALES.includes(value as SupportedLocale);
};

const stripLeadingLocale = (path: string | null | undefined) => {
    if (!path) return '/';
    const parts = path.split('/');
    if (parts.length > 1 && isSupportedLocale(parts[1])) {
        const rest = parts.slice(2).join('/');
        return rest ? `/${rest}` : '/';
    }
    return path || '/';
};

export default function LocalePersistence() {
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const currentLocale = localStorage.getItem('preferredLocale');
        if (currentLocale !== locale) {
            localStorage.setItem('preferredLocale', locale);
            console.log(`LocalePersistence: Updated stored locale to ${locale}`);
        }
    }, [locale]);

    useEffect(() => {
        if (typeof window === 'undefined') {
            return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        const forceLocale = urlParams.get('forceLocale');

        if (forceLocale && isSupportedLocale(forceLocale) && forceLocale !== locale) {
            console.log(`LocalePersistence: Forcing locale to ${forceLocale} from URL parameter`);
            localStorage.setItem('preferredLocale', forceLocale);
            router.push(stripLeadingLocale(pathname), { locale: forceLocale });
            return;
        }

        const savedLocale = localStorage.getItem('preferredLocale');
        if (savedLocale && savedLocale !== locale && isSupportedLocale(savedLocale)) {
            console.log(`LocalePersistence: Switching to saved locale ${savedLocale}`);
            router.push(stripLeadingLocale(pathname), { locale: savedLocale });
        }
    }, [locale, pathname, router]);

    return null;
}
