'use client';

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Settings, X, Moon, Sun, Bell, Shield, User, Palette, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from '@/lib/framer-motion';
import { cn } from '@/lib/utils';
import ReliableLanguageSwitcher from '@/components/ui/reliable-language-switcher';
import { useTheme } from '@/components/providers/theme-provider';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
}

interface UserSettings {
    theme: 'light' | 'dark' | 'system';
    language: string;
    notifications: {
        email: boolean;
        push: boolean;
        sms: boolean;
        appointments: boolean;
        reminders: boolean;
        updates: boolean;
    };
    privacy: {
        shareHealthData: boolean;
        allowAnalytics: boolean;
        showOnlineStatus: boolean;
    };
    profile: {
        name: string;
        email: string;
        phone: string;
        timezone: string;
    };
    accessibility: {
        fontSize: 'small' | 'medium' | 'large';
        highContrast: boolean;
        reducedMotion: boolean;
        soundEffects: boolean;
    };
}

const defaultSettings: UserSettings = {
    theme: 'system',
    language: 'en',
    notifications: {
        email: true,
        push: true,
        sms: false,
        appointments: true,
        reminders: true,
        updates: false,
    },
    privacy: {
        shareHealthData: false,
        allowAnalytics: true,
        showOnlineStatus: true,
    },
    profile: {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1 (555) 123-4567',
        timezone: 'America/New_York',
    },
    accessibility: {
        fontSize: 'medium',
        highContrast: false,
        reducedMotion: false,
        soundEffects: true,
    },
};

export default function SettingsModal({ isOpen, onClose }: SettingsModalProps) {
    const t = useTranslations('Settings');
    const { theme, setTheme } = useTheme();
    const [settings, setSettings] = useState<UserSettings>({
        ...defaultSettings,
        theme,
    });
    const [activeTab, setActiveTab] = useState<'general' | 'notifications' | 'privacy' | 'profile' | 'accessibility'>('general');
    const [hasChanges, setHasChanges] = useState(false);
    const [isClient, setIsClient] = useState(false);

    // Prevent hydration issues
    useEffect(() => {
        setIsClient(true);
    }, []);

    // Prevent background scroll when modal is open and restore on close
    useEffect(() => {
        if (!isClient) return;
        if (!isOpen) return;
        const scrollY = window.scrollY;
        const original = {
            position: document.body.style.position,
            top: document.body.style.top,
            overflow: document.body.style.overflow,
            width: document.body.style.width,
        };
        document.body.style.position = 'fixed';
        document.body.style.top = `-${scrollY}px`;
        document.body.style.overflow = 'hidden';
        document.body.style.width = '100%';
        return () => {
            document.body.style.position = original.position;
            document.body.style.top = original.top;
            document.body.style.overflow = original.overflow;
            document.body.style.width = original.width;
            const y = parseInt((original.top || '0').toString().replace('-', '')) || scrollY;
            window.scrollTo(0, y);
        };
    }, [isOpen, isClient]);

    useEffect(() => {
        if (!isClient) return;
        let cancelled = false;

        const loadSettings = async () => {
            try {
                const response = await fetch('/api/user/settings', { credentials: 'include' });
                if (!response.ok) throw new Error('Failed to load settings');
                const data = await response.json();
                if (cancelled) return;
                setSettings(prev => {
                    const merged: UserSettings = {
                        ...prev,
                        ...(data.preferences ? {
                            theme: (data.preferences.theme ?? prev.theme) as UserSettings['theme'],
                            notifications: { ...prev.notifications, ...data.preferences.notifications },
                            accessibility: { ...prev.accessibility, ...data.preferences.accessibility },
                        } : {}),
                        ...(data.profile ? { profile: { ...prev.profile, ...data.profile } } : {}),
                    };
                    if (data.preferences?.theme) {
                        setTheme(data.preferences.theme);
                    }
                    return merged;
                });
            } catch {
                // ignore fetch errors
            }
        };

        loadSettings();

        const savedSettings = typeof window !== 'undefined' ? localStorage.getItem('userSettings') : null;
        if (savedSettings) {
            try {
                const parsed = JSON.parse(savedSettings) as Partial<UserSettings>;
                setSettings(prev => {
                    const merged = { ...prev, ...parsed } as UserSettings;
                    if (parsed.theme) {
                        setTheme(parsed.theme);
                    }
                    return merged;
                });
            } catch (error) {
                console.error('Failed to parse saved settings:', error);
            }
        }

        return () => {
            cancelled = true;
        };
    }, [isClient, setTheme]);

    useEffect(() => {
        setSettings(prev => (prev.theme === theme ? prev : { ...prev, theme }));
    }, [theme]);

    const updateSettings = (path: string, value: unknown) => {
        setSettings(prev => {
            const newSettings = JSON.parse(JSON.stringify(prev)) as UserSettings;
            const keys = path.split('.');
            let current: Record<string, unknown> = newSettings as unknown as Record<string, unknown>;

            for (let i = 0; i < keys.length - 1; i += 1) {
                const key = keys[i];
                const next = current[key];
                if (typeof next === 'object' && next !== null) {
                    current[key] = { ...(next as Record<string, unknown>) };
                } else {
                    current[key] = {};
                }
                current = current[key] as Record<string, unknown>;
            }
            current[keys[keys.length - 1]] = value as never;

            return newSettings;
        });
        setHasChanges(true);
    };

    const saveSettings = async () => {
        try {
            if (typeof window !== 'undefined') {
                localStorage.setItem('userSettings', JSON.stringify(settings));
            }

            // Apply theme instantly
            setTheme(settings.theme);

            // Accessibility classes
            if (typeof document !== 'undefined') {
                const root = document.documentElement;
            root.style.setProperty('--app-font-scale', settings.accessibility.fontSize === 'small' ? '0.95' : settings.accessibility.fontSize === 'large' ? '1.1' : '1');
            if (settings.accessibility.highContrast) root.classList.add('hc'); else root.classList.remove('hc');
            if (settings.accessibility.reducedMotion) root.classList.add('rm'); else root.classList.remove('rm');
            }

            // Here you would typically save to your backend
            const response = await fetch('/api/user/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });

            if (response.ok) {
                setHasChanges(false);
                // Show success toast or notification
            }
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    };

    const resetSettings = () => {
        setSettings(defaultSettings);
        setTheme(defaultSettings.theme);
        setHasChanges(true);
    };

    const tabs = useMemo(() => ([
        { id: 'general', label: t('general'), icon: Settings },
        { id: 'notifications', label: t('notifications'), icon: Bell },
        { id: 'privacy', label: t('privacy'), icon: Shield },
        { id: 'profile', label: t('profile'), icon: User },
        { id: 'accessibility', label: t('accessibility'), icon: Palette },
    ] as const), [t]);

    const timezones = [
        'America/New_York',
        'America/Los_Angeles',
        'America/Chicago',
        'Europe/London',
        'Europe/Paris',
        'Asia/Tokyo',
        'Asia/Shanghai',
        'Australia/Sydney',
    ];

    if (!isOpen || !isClient) return null;

    return (
    <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex min-h-screen items-center justify-center bg-black/60 px-4 py-8"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    className="flex w-full max-w-4xl max-h-[90vh] flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-800 dark:bg-gray-900"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-800">
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 flex items-center">
                            <Settings className="h-6 w-6 mr-3" />
                            {t('title')}
                        </h2>
                        <Button variant="ghost" size="icon" onClick={onClose}>
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    <div className="flex flex-1 flex-col overflow-hidden lg:flex-row">
                        {/* Sidebar */}
                        <div className="w-full lg:w-64 border-b lg:border-b-0 lg:border-r border-gray-200 dark:border-gray-800 p-4 bg-white dark:bg-gray-900 overflow-y-auto">
                            <nav className="space-y-2">
                                {tabs.map((tab) => {
                                    const Icon = tab.icon;
                                    return (
                                        <button
                                            key={tab.id}
                                            onClick={() => setActiveTab(tab.id)}
                                            className={cn(
                                                "w-full flex items-center px-3 py-2 text-left rounded-lg transition-colors",
                                                activeTab === tab.id
                                                    ? "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-200"
                                                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/80"
                                            )}
                                        >
                                            <Icon className="h-4 w-4 mr-3" />
                                            {tab.label}
                                        </button>
                                    );
                                })}
                            </nav>
                        </div>

                        {/* Content */}
                        <div className="flex-1 overflow-y-auto overscroll-contain bg-white dark:bg-gray-900">
                            <div className="p-6 text-gray-900 dark:text-gray-100">
                                {activeTab === 'general' && (
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-lg font-semibold mb-4">{t('appearance')}</h3>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium mb-2">{t('theme')}</label>
                                                    <div className="flex space-x-2">
                            {(['light', 'dark', 'system'] as const).map((opt) => (
                                                            <button
                                                                key={opt}
                                onClick={() => { updateSettings('theme', opt); setTheme(opt); }}
                                                                className={cn(
                                                                    "flex items-center px-4 py-2 rounded-lg border transition-colors",
                                                                    settings.theme === opt
                                                                        ? "border-blue-500 bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-200"
                                                                        : "border-gray-300 hover:border-gray-400 dark:border-gray-700 dark:hover:border-gray-600"
                                                                )}
                                                            >
                                                                {opt === 'light' && <Sun className="h-4 w-4 mr-2" />}
                                                                {opt === 'dark' && <Moon className="h-4 w-4 mr-2" />}
                                                                {opt === 'system' && <Monitor className="h-4 w-4 mr-2" />}
                                                                {t(opt as 'light' | 'dark' | 'system')}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div>
                                                    <ReliableLanguageSwitcher variant="select" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'notifications' && (
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-lg font-semibold mb-4">{t('notifications')}</h3>
                                            <div className="space-y-4">
                                                {Object.entries(settings.notifications).slice(0, 3).map(([key, value]) => (
                                                    <div key={key} className="flex items-center justify-between">
                                                        <label className="text-sm font-medium capitalize text-gray-800 dark:text-gray-200">{key}</label>
                                                        <input
                                                            type="checkbox"
                                                            checked={value}
                                                            onChange={(e) => updateSettings(`notifications.${key}`, e.target.checked)}
                                                            className="rounded accent-blue-600"
                                                            aria-label={`Toggle ${key} notification`}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <h3 className="text-lg font-semibold mb-4">{t('notifications')}</h3>
                                            <div className="space-y-4">
                                                {Object.entries(settings.notifications).slice(3).map(([key, value]) => (
                                                    <div key={key} className="flex items-center justify-between">
                                                        <label className="text-sm font-medium capitalize text-gray-800 dark:text-gray-200">{key}</label>
                                                        <input
                                                            type="checkbox"
                                                            checked={value}
                                                            onChange={(e) => updateSettings(`notifications.${key}`, e.target.checked)}
                                                            className="rounded accent-blue-600"
                                                            aria-label={`Toggle ${key} notification`}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'privacy' && (
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-lg font-semibold mb-4">{t('privacy')}</h3>
                                            <div className="space-y-4">
                                                {Object.entries(settings.privacy).map(([key, value]) => (
                            <div key={key} className="flex items-center justify-between">
                                                        <div>
                                <label className="text-sm font-medium capitalize text-gray-800 dark:text-gray-200">
                                                                {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
                                                            </label>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                                {key === 'shareHealthData' && 'Allow sharing anonymized health data for research'}
                                                                {key === 'allowAnalytics' && 'Help improve our service with usage analytics'}
                                                                {key === 'showOnlineStatus' && 'Show when you are online to healthcare providers'}
                                                            </p>
                                                        </div>
                                                        <input
                                                            type="checkbox"
                                                            checked={value}
                                                            onChange={(e) => updateSettings(`privacy.${key}`, e.target.checked)}
                                className="rounded accent-blue-600"
                                                            aria-label={`Toggle ${key} privacy setting`}
                                                        />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'profile' && (
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-lg font-semibold mb-4">{t('profile')}</h3>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium mb-2">Full Name</label>
                                                    <Input
                                                        value={settings.profile.name}
                                                        onChange={(e) => updateSettings('profile.name', e.target.value)}
                                                        placeholder="Enter your full name"
                                                        aria-label="Full Name"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium mb-2">Email</label>
                                                    <Input
                                                        type="email"
                                                        value={settings.profile.email}
                                                        onChange={(e) => updateSettings('profile.email', e.target.value)}
                                                        placeholder="Enter your email address"
                                                        aria-label="Email"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium mb-2">Phone</label>
                                                    <Input
                                                        value={settings.profile.phone}
                                                        onChange={(e) => updateSettings('profile.phone', e.target.value)}
                                                        placeholder="Enter your phone number"
                                                        aria-label="Phone"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium mb-2">Timezone</label>
                                                    <select
                                                        value={settings.profile.timezone}
                                                        onChange={(e) => updateSettings('profile.timezone', e.target.value)}
                                                        className="w-full p-2 border border-gray-300 rounded-lg bg-white dark:bg-gray-800 dark:border-gray-700"
                                                        aria-label="Select timezone"
                                                    >
                                                        {timezones.map((tz) => (
                                                            <option key={tz} value={tz}>
                                                                {tz.replace('_', ' ')}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'accessibility' && (
                                    <div className="space-y-6">
                                        <div>
                                            <h3 className="text-lg font-semibold mb-4">{t('accessibility')}</h3>
                                            <div className="space-y-4">
                                                <div>
                                                    <label className="block text-sm font-medium mb-2">Font Size</label>
                                                    <div className="flex space-x-2">
                                                        {(['small', 'medium', 'large'] as const).map((size) => (
                                                            <button
                                                                key={size}
                                                                onClick={() => updateSettings('accessibility.fontSize', size)}
                                                                className={cn(
                                                                    "px-4 py-2 rounded-lg border transition-colors",
                                                                    settings.accessibility.fontSize === size
                                                                        ? "border-blue-500 bg-blue-50 text-blue-700"
                                                                        : "border-gray-300 hover:border-gray-400"
                                                                )}
                                                            >
                                                                {size.charAt(0).toUpperCase() + size.slice(1)}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                                        <label className="text-sm font-medium">High Contrast</label>
                                                        <input
                                                            type="checkbox"
                                                            checked={settings.accessibility.highContrast}
                                                            onChange={(e) => updateSettings('accessibility.highContrast', e.target.checked)}
                                className="rounded accent-blue-600"
                                                            aria-label="Toggle High Contrast Mode"
                                                        />
                                                    </div>
                            <div className="flex items-center justify-between">
                                                        <label className="text-sm font-medium">Reduced Motion</label>
                                                        <input
                                                            type="checkbox"
                                                            checked={settings.accessibility.reducedMotion}
                                                            onChange={(e) => updateSettings('accessibility.reducedMotion', e.target.checked)}
                                className="rounded accent-blue-600"
                                                            aria-label="Toggle Reduced Motion"
                                                        />
                                                    </div>
                            <div className="flex items-center justify-between">
                                                        <label className="text-sm font-medium">Sound Effects</label>
                                                        <input
                                                            type="checkbox"
                                                            checked={settings.accessibility.soundEffects}
                                                            onChange={(e) => updateSettings('accessibility.soundEffects', e.target.checked)}
                                className="rounded accent-blue-600"
                                                            aria-label="Toggle Sound Effects"
                                                        />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

            {/* Footer */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-gray-200 bg-white p-6 dark:border-gray-800 dark:bg-gray-900">
                        <Button variant="outline" onClick={resetSettings}>
                            {t('reset')}
                        </Button>
                        <div className="flex space-x-3">
                            <Button variant="outline" onClick={onClose}>
                                {t('cancel')}
                            </Button>
                            <Button
                                onClick={saveSettings}
                                disabled={!hasChanges}
                                variant="gradient"
                                size="lg"
                                className="w-full justify-center mt-4 shadow-lg hover:scale-105 transition-transform"
                            >
                                {t('save')}
                            </Button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
}
