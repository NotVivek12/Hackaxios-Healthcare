'use client';

import { useState } from 'react';
import { useRouter, usePathname } from '@/navigation';
import { useLocale } from 'next-intl';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from '@/lib/framer-motion';
import { cn } from '@/lib/utils';

interface LanguageSwitcherProps {
    variant?: 'dropdown' | 'select';
    showIcon?: boolean;
    className?: string;
}

const languages = [
    { code: 'en', name: 'English', flag: '🇺🇸' },
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'fr', name: 'Français', flag: '🇫🇷' },
    { code: 'pt', name: 'Português', flag: '🇧🇷' },
    { code: 'ar', name: 'العربية', flag: '🇸🇦' },
    { code: 'hi', name: 'हिन्दी', flag: '🇮🇳' },
    { code: 'sw', name: 'Kiswahili', flag: '🇰🇪' },
] as const;

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

export default function LanguageSwitcher({
    variant = 'dropdown',
    showIcon = true,
    className
}: LanguageSwitcherProps) {
    const [isOpen, setIsOpen] = useState(false);
    const locale = useLocale();
    const router = useRouter();
    const pathname = usePathname();

    const currentLanguage = languages.find(lang => lang.code === locale) || languages[0];

    const handleLanguageChange = (newLocale: SupportedLocale) => {
        // Close dropdown
        setIsOpen(false);

        // Store language preference in localStorage immediately
        if (typeof window !== 'undefined') {
            localStorage.setItem('preferredLocale', newLocale);
        }

        // Navigate to the same page but with new locale
        try {
            const basePath = stripLeadingLocale(pathname);
            router.push(basePath, { locale: newLocale });
        } catch (error) {
            console.error('Error changing language:', error);
            // Fallback: construct the URL manually
            if (typeof window !== 'undefined') {
                const currentPath = window.location.pathname;
                const segments = currentPath.split('/');
                // Remove the first segment (which is the current locale)
                const pathWithoutLocale = segments.slice(2).join('/');
                const newPath = `/${newLocale}${pathWithoutLocale ? '/' + pathWithoutLocale : ''}`;
                console.log('Redirecting to:', newPath);
                window.location.href = newPath;
            }
        }
    };

    if (variant === 'select') {
        return (
            <div className={cn("w-full", className)}>
                <label className="block text-sm font-medium mb-2">Language</label>
                <select
                    value={locale}
                    onChange={(e) => handleLanguageChange(e.target.value as SupportedLocale)}
                    className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                    aria-label="Select language"
                >
                    {languages.map((lang) => (
                        <option key={lang.code} value={lang.code}>
                            {lang.flag} {lang.name}
                        </option>
                    ))}
                </select>
                <p className="text-xs text-gray-500 mt-1">
                    Language will change after selection
                </p>
            </div>
        );
    }

    return (
        <div className={cn("relative", className)}>
            <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center space-x-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                aria-label="Language selector"
                aria-expanded={isOpen}
            >
                {showIcon && <Globe className="h-4 w-4" />}
                <span className="hidden sm:inline">{currentLanguage.flag}</span>
                <span className="text-sm">{currentLanguage.name}</span>
                <ChevronDown className={cn(
                    "h-4 w-4 transition-transform duration-200",
                    isOpen ? "rotate-180" : ""
                )} />
            </Button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Overlay */}
                        <div
                            className="fixed inset-0 z-10"
                            onClick={() => setIsOpen(false)}
                            aria-hidden="true"
                        />

                        {/* Dropdown */}
                        <motion.div
                            initial={{ opacity: 0, y: -10, scale: 0.95 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -10, scale: 0.95 }}
                            transition={{ duration: 0.2 }}
                            className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 max-h-60 overflow-y-auto"
                        >
                            <div className="py-2">
                                {languages.map((lang) => (
                                    <button
                                        key={lang.code}
                                        onClick={() => handleLanguageChange(lang.code as SupportedLocale)}
                                        className={cn(
                                            "w-full flex items-center justify-between px-4 py-2 text-left hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors",
                                            locale === lang.code ? "bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300" : "text-gray-700 dark:text-gray-300"
                                        )}
                                        aria-label={`Switch to ${lang.name}`}
                                    >
                                        <div className="flex items-center space-x-3">
                                            <span className="text-lg">{lang.flag}</span>
                                            <span className="text-sm font-medium">{lang.name}</span>
                                        </div>
                                        {locale === lang.code && (
                                            <Check className="h-4 w-4 text-blue-600" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
