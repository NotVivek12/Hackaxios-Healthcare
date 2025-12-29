import { getRequestConfig } from 'next-intl/server';

const SUPPORTED_LOCALES = ['en', 'es', 'fr', 'hi', 'pt', 'sw', 'ar'] as const;
type SupportedLocale = typeof SUPPORTED_LOCALES[number];

const isSupportedLocale = (value: string | undefined | null): value is SupportedLocale => {
    return Boolean(value && SUPPORTED_LOCALES.includes(value as SupportedLocale));
};

export default getRequestConfig(async ({ locale, requestLocale }) => {
    const requested = locale ?? await requestLocale;
    const resolvedLocale: SupportedLocale = isSupportedLocale(requested) ? requested : 'en';

    return {
        locale: resolvedLocale,
        // Keep messages folder next to this file for reliable bundling
        messages: (await import(`./messages/${resolvedLocale}.json`)).default
    };
});
