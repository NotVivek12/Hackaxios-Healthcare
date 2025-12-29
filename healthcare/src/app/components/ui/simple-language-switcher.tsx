'use client';

import { useState } from 'react';
import { useLocale } from 'next-intl';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { motion, AnimatePresence } from '@/lib/framer-motion';
import { cn } from '@/lib/utils';

interface SimpleLanguageSwitcherProps {
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

export default function SimpleLanguageSwitcher({ className }: SimpleLanguageSwitcherProps) {
    const [isOpen, setIsOpen] = useState(false);
    const locale = useLocale();

    const currentLanguage = languages.find(lang => lang.code === locale) || languages[0];

    const handleLanguageChange = (newLocale: string) => {
        setIsOpen(false);

        // Store language preference in localStorage
        if (typeof window !== 'undefined') {
            try {
                // Store the new locale preference
                localStorage.setItem('preferredLocale', newLocale);

                // Get the current path and construct new URL
                const currentPath = window.location.pathname;
                const segments = currentPath.split('/').filter(Boolean);

                // Remove the first segment (current locale)
                // Make sure we handle the case where we're on the root path
                const pathWithoutLocale = segments.length > 1 ? segments.slice(1).join('/') : '';

                // Construct the new path with the selected locale
                const newPath = `/${newLocale}${pathWithoutLocale ? '/' + pathWithoutLocale : ''}`;

                console.log('Current path:', currentPath);
                console.log('New path:', newPath);

                // Add query params if they exist (but exclude our cache busting params)
                const url = new URL(window.location.href);
                url.searchParams.delete('_i18n_refresh');
                url.searchParams.delete('_t');
                const cleanSearch = url.search;

                // Navigate to new locale
                window.location.href = `${newPath}${cleanSearch}`;

                // For extra reliability, reload after a short delay if the navigation didn't happen
                setTimeout(() => {
                    if (locale === newLocale) {
                        console.log('Forcing reload to refresh translations');
                        window.location.reload();
                    }
                }, 500);
            } catch (error) {
                console.error('Error during language switch:', error);
                // Fallback to a simpler approach if something went wrong
                window.location.href = `/${newLocale}`;
            }
        }
    };

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
                <Globe className="h-4 w-4" />
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
                                        onClick={() => handleLanguageChange(lang.code)}
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
