'use client';

import { useLocale, useTranslations } from 'next-intl';
import { usePathname } from '@/navigation';
import { Link } from '@/navigation';
import LanguageSwitcher from '@/components/ui/language-switcher';
import SimpleLanguageSwitcher from '@/components/ui/simple-language-switcher';
import ReliableLanguageSwitcher from '@/components/ui/reliable-language-switcher';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { forceTranslationRefresh } from '@/lib/clear-intl-cache';

export default function TestPageClient() {
    const locale = useLocale();
    const pathname = usePathname();
    const t = useTranslations('Home');

    return (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">Language Switcher Test</h2>

            <div className="mb-4 p-3 bg-gray-100 rounded-lg">
                <h3 className="font-medium mb-2">Debug Info:</h3>
                <p><strong>Current Locale:</strong> {locale}</p>
                <p><strong>Current Pathname:</strong> {pathname}</p>
                <p><strong>Sample Translation:</strong> {t('hero.title')}</p>
                <Button
                    onClick={forceTranslationRefresh}
                    className="mt-2 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md flex items-center"
                >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Force Refresh Translations
                </Button>
            </div>

            <div className="mb-6 p-3 bg-blue-50 rounded-lg">
                <h3 className="font-medium mb-2">Navigation Links (Using next-intl Link):</h3>
                <div className="flex flex-wrap gap-2">
                    <Link href="/test-translations" locale="en" className="px-3 py-1 bg-white border rounded hover:bg-gray-50">
                        🇺🇸 English
                    </Link>
                    <Link href="/test-translations" locale="es" className="px-3 py-1 bg-white border rounded hover:bg-gray-50">
                        🇪🇸 Español
                    </Link>
                    <Link href="/test-translations" locale="fr" className="px-3 py-1 bg-white border rounded hover:bg-gray-50">
                        🇫🇷 Français
                    </Link>
                    <Link href="/test-translations" locale="pt" className="px-3 py-1 bg-white border rounded hover:bg-gray-50">
                        🇧🇷 Português
                    </Link>
                    <Link href="/test-translations" locale="ar" className="px-3 py-1 bg-white border rounded hover:bg-gray-50">
                        🇸🇦 العربية
                    </Link>
                    <Link href="/test-translations" locale="hi" className="px-3 py-1 bg-white border rounded hover:bg-gray-50">
                        🇮🇳 हिन्दी
                    </Link>
                    <Link href="/test-translations" locale="sw" className="px-3 py-1 bg-white border rounded hover:bg-gray-50">
                        🇰🇪 Kiswahili
                    </Link>
                </div>
            </div>

            <div className="mb-4">
                <h3 className="font-medium mb-2">Simple Language Switcher (with debugging):</h3>
                <SimpleLanguageSwitcher />
            </div>

            <div className="mb-4">
                <h3 className="font-medium mb-2">Original Dropdown Switcher:</h3>
                <LanguageSwitcher variant="dropdown" />
            </div>

            <div className="mb-4">
                <h3 className="font-medium mb-2">Reliable Language Switcher:</h3>
                <ReliableLanguageSwitcher />
            </div>

            <div className="mb-4">
                <h3 className="font-medium mb-2">Select Switcher:</h3>
                <LanguageSwitcher variant="select" />
            </div>
        </div>
    );
}
