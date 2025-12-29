'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { Bell, X, Clock, AlertCircle, Calendar, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { motion, AnimatePresence } from '@/lib/framer-motion';
import { cn } from '@/lib/utils';
import { useTheme } from '@/components/providers/theme-provider';

interface Notification {
    id: string;
    type: 'appointment' | 'reminder' | 'alert' | 'update';
    title: string;
    message: string;
    timestamp: Date;
    isRead: boolean;
    action?: {
        label: string;
        href: string;
    };
}

type NotificationPayload = Omit<Notification, 'timestamp' | 'isRead'> & {
    timestamp: string | number | Date;
    isRead?: boolean;
};

interface NotificationsDropdownProps {
    isOpen: boolean;
    onToggle: () => void;
    onClose: () => void;
    triggerClassName?: string;
}

// Local storage key for read notifications
const READ_KEY = 'readNotifications';

export default function NotificationsDropdown({ isOpen, onToggle, onClose, triggerClassName }: NotificationsDropdownProps) {
    const t = useTranslations('Notifications');
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [isClient, setIsClient] = useState(false);
    const [readIds, setReadIds] = useState<string[]>([]);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const readIdsRef = useRef<Set<string>>(new Set());
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === 'dark';

    // Prevent hydration issues
    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        if (!isClient) return;
        try {
            const stored = JSON.parse(localStorage.getItem(READ_KEY) || '[]');
            if (Array.isArray(stored)) {
                setReadIds(stored);
                readIdsRef.current = new Set(stored);
            }
        } catch {
            setReadIds([]);
            readIdsRef.current = new Set();
        }
    }, [isClient]);

    useEffect(() => {
        readIdsRef.current = new Set(readIds);
        setNotifications(prev =>
            prev.map(notification => ({
                ...notification,
                isRead: readIdsRef.current.has(notification.id),
            }))
        );
    }, [readIds]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                onClose();
            }
        };

        if (isOpen && isClient) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen, onClose, isClient]);

    const normalizeNotifications = useCallback((payload: NotificationPayload[] = []) => {
        const readSet = readIdsRef.current;
        return payload
            .map((n) => ({
                id: n.id,
                type: n.type,
                title: n.title,
                message: n.message,
                timestamp: new Date(n.timestamp),
                isRead: n.isRead ?? readSet.has(n.id),
                action: n.action,
            }))
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }, []);

    const bootstrapNotifications = useCallback(async () => {
        try {
            const res = await fetch('/api/notifications', { credentials: 'include' });
            if (!res.ok) {
                setNotifications([]);
                return;
            }
            const data = await res.json() as { notifications?: NotificationPayload[] };
            setNotifications(normalizeNotifications(data.notifications || []));
        } catch {
            setNotifications([]);
        }
    }, [normalizeNotifications]);

    useEffect(() => {
        if (!isClient) return;
        bootstrapNotifications();
        let source: EventSource | null = null;
        let retry: ReturnType<typeof setTimeout> | null = null;

        const connect = () => {
            source = new EventSource('/api/notifications/stream', { withCredentials: true });
            source.onmessage = (event) => {
                if (!event.data) return;
                try {
                    const payload = JSON.parse(event.data) as { notifications?: NotificationPayload[] };
                    if (payload?.notifications) {
                        setNotifications(normalizeNotifications(payload.notifications));
                    }
                } catch {
                    // ignore malformed payloads
                }
            };
            source.onerror = () => {
                source?.close();
                if (retry) clearTimeout(retry);
                retry = setTimeout(connect, 4000);
            };
        };

        connect();

        return () => {
            source?.close();
            if (retry) clearTimeout(retry);
        };
    }, [isClient, bootstrapNotifications, normalizeNotifications]);

    const getNotificationIcon = (type: Notification['type']) => {
        switch (type) {
            case 'appointment':
                return <Calendar className="h-4 w-4 text-blue-500" />;
            case 'reminder':
                return <Clock className="h-4 w-4 text-orange-500" />;
            case 'alert':
                return <AlertCircle className="h-4 w-4 text-red-500" />;
            case 'update':
                return <FileText className="h-4 w-4 text-green-500" />;
            default:
                return <Bell className="h-4 w-4 text-gray-500" />;
        }
    };

    const formatTimestamp = (timestamp: Date) => {
        const now = new Date();
        const diff = now.getTime() - timestamp.getTime();
        const minutes = Math.floor(diff / (1000 * 60));
        const hours = Math.floor(diff / (1000 * 60 * 60));
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));

        if (minutes < 60) {
            return `${minutes}m ago`;
        } else if (hours < 24) {
            return `${hours}h ago`;
        } else {
            return `${days}d ago`;
        }
    };

    const persistReadIds = (updater: (current: string[]) => string[]) => {
        setReadIds(prev => {
            const next = updater(prev);
            if (typeof window !== 'undefined') {
                localStorage.setItem(READ_KEY, JSON.stringify(next));
            }
            return next;
        });
    };

    const markAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => (n.id === id ? { ...n, isRead: true } : n)));
        persistReadIds(prev => (prev.includes(id) ? prev : [...prev, id]));
    };

    const markAllAsRead = () => {
        setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
        const ids = notifications.map(n => n.id);
        persistReadIds(() => ids);
    };

    const removeNotification = (id: string) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
        persistReadIds(prev => (prev.includes(id) ? prev : [...prev, id]));
    };

    const unreadCount = notifications.filter(n => !n.isRead).length;

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Notification Button */}
            <Button
                variant="ghost"
                size="icon"
                className={cn(
                    'relative flex h-11 w-11 items-center justify-center rounded-full border transition-all duration-200 focus-visible:ring-2 focus-visible:ring-offset-2',
                    isDark
                        ? 'border-white/15 bg-white/5 text-white hover:bg-white/10 focus-visible:ring-white/40'
                        : 'border-gray-200 bg-white/90 text-slate-800 hover:bg-white focus-visible:ring-blue-300',
                    isOpen && (isDark ? 'ring-1 ring-white/50' : 'ring-1 ring-blue-400/60'),
                    triggerClassName
                )}
                onClick={onToggle}
                aria-label={t('title')}
            >
                <div className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <span className="absolute -inset-2 rounded-full bg-blue-500/10 animate-pulse" />
                    )}
                </div>
                {unreadCount > 0 && (
                    <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center font-medium shadow"
                    >
                        {unreadCount > 9 ? '9+' : unreadCount}
                    </motion.span>
                )}
            </Button>

            {/* Dropdown */}
            <AnimatePresence>
                {isOpen && isClient && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: -10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: -10 }}
                        transition={{ duration: 0.2 }}
                        className="absolute right-0 mt-2 w-96 z-50"
                    >
                        <Card className={cn(
                            'shadow-2xl backdrop-blur-xl border rounded-2xl overflow-hidden',
                            isDark ? 'border-white/10 bg-slate-900/80' : 'border-gray-200/70 bg-white/95'
                        )}>
                            <CardContent className="p-0">
                                {/* Header */}
                                <div className={cn(
                                    'p-4 border-b flex items-center justify-between',
                                    isDark ? 'border-white/10 bg-slate-900/60' : 'border-gray-200/60 bg-gradient-to-r from-white to-blue-50'
                                )}>
                                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                                        {t('title')}
                                    </h3>
                                    {unreadCount > 0 && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={markAllAsRead}
                                            className="text-xs text-blue-700 hover:bg-blue-100 dark:text-blue-300 dark:hover:bg-blue-500/10"
                                        >
                                            {t('markAllRead')}
                                        </Button>
                                    )}
                                </div>

                                {/* Notifications List */}
                                <div className="max-h-96 overflow-y-auto">
                                    {notifications.length === 0 ? (
                                        <div className="p-8 text-center">
                                            <Bell className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                                            <p className="text-gray-500 dark:text-gray-400">{t('noNotifications')}</p>
                                        </div>
                                    ) : (
                                        <div className="space-y-1">
                                            {notifications.map((notification) => (
                                                <motion.div
                                                    key={notification.id}
                                                    initial={{ opacity: 0, x: -20 }}
                                                    animate={{ opacity: 1, x: 0 }}
                                                    className={cn(
                                                        'group p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors cursor-pointer',
                                                        !notification.isRead && 'bg-blue-50/60 dark:bg-blue-900/20 border-l-4 border-blue-400/70'
                                                    )}
                                                    onClick={() => markAsRead(notification.id)}
                                                >
                                                    <div className="flex items-start space-x-3">
                                                        <div className="flex-shrink-0 mt-1">
                                                            {getNotificationIcon(notification.type)}
                                                        </div>
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center justify-between">
                                                                <p className={cn(
                                                                    'text-sm font-medium',
                                                                    notification.isRead ? 'text-gray-700 dark:text-gray-300' : 'text-gray-900 dark:text-white'
                                                                )}>
                                                                    {notification.title}
                                                                </p>
                                                                <div className="flex items-center space-x-2">
                                                                    <span className="text-xs text-gray-500">
                                                                        {formatTimestamp(notification.timestamp)}
                                                                    </span>
                                                                    <Button
                                                                        variant="ghost"
                                                                        size="icon"
                                                                        className="h-6 w-6 opacity-0 group-hover:opacity-100 hover:bg-red-100 hover:text-red-600 rounded-full"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            removeNotification(notification.id);
                                                                        }}
                                                                    >
                                                                        <X className="h-3 w-3" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                            <p className={cn(
                                                                'text-sm mt-1',
                                                                notification.isRead ? 'text-gray-500 dark:text-gray-400' : 'text-gray-700 dark:text-gray-300'
                                                            )}>
                                                                {notification.message}
                                                            </p>
                                                            {notification.action && (
                                                                <Button
                                                                    variant="ghost"
                                                                    size="sm"
                                                                    className="mt-2 text-xs text-blue-600 hover:text-blue-700 p-0 h-auto"
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        // Navigate to the action href
                                                                        window.location.href = notification.action!.href;
                                                                    }}
                                                                >
                                                                    {notification.action.label}
                                                                </Button>
                                                            )}
                                                        </div>
                                                        {!notification.isRead && (
                                                            <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 mt-2"></div>
                                                        )}
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Footer */}
                                {notifications.length > 0 && (
                                    <div className={cn(
                                        'p-4 border-t',
                                        isDark ? 'border-white/10 bg-slate-900/50' : 'border-gray-200/60 bg-white/60'
                                    )}>
                                        <Button
                                            variant="ghost"
                                            className="w-full text-sm text-blue-600 hover:text-blue-700 dark:text-blue-300 dark:hover:text-blue-200"
                                            onClick={() => {
                                                // Navigate to notifications page
                                                window.location.href = '/notifications';
                                            }}
                                        >
                                            {t('viewAll')}
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}
