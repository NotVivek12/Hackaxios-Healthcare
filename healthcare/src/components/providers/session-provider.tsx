'use client';

import { SessionProvider } from 'next-auth/react';
import { ReactNode, useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';

interface Props {
    children: ReactNode;
    /** If true, never show the blocking overlay (useful on auth pages) */
    disableOverlay?: boolean;
}

export default function AuthProvider({ children, disableOverlay }: Props) {
    const [isLoading, setIsLoading] = useState(true);
    const [loadingMessage, setLoadingMessage] = useState('Loading your healthcare data...');

    // Use effect to optimize loading experience
    useEffect(() => {
        // Early exit on auth pages or when overlay disabled
        const isAuthRoute = typeof window !== 'undefined' && /\/auth\/(signin|signup|forgot-password)/.test(window.location.pathname);
        if (disableOverlay || isAuthRoute) {
            setIsLoading(false);
            return;
        }

        // Check for stored auth data to make loading appear faster
        const storedSession = typeof window !== 'undefined' ? localStorage.getItem('userSession') : null;
        let quickCheckTimer: ReturnType<typeof setTimeout> | undefined;

        // Set a maximum time for loading state
        const maxLoadTimer = setTimeout(() => {
            setIsLoading(false);
        }, 3000);

        // If we have cached session data, reduce loading time
        if (storedSession) {
            setLoadingMessage('Welcome back! Loading your data...');

            // Do a quick check to the API to verify session
            try {
                // Add cache-busting parameter
                fetch(`/api/auth/session?_t=${Date.now()}`)
                    .then(res => res.json())
                    .then(data => {
                        if (data.authenticated) {
                            // Valid session, finish loading quickly
                            setTimeout(() => setIsLoading(false), 300);
                        } else {
                            // Invalid session but we have local data, slightly longer load
                            // but still faster than a full load
                            setTimeout(() => setIsLoading(false), 800);
                        }
                    })
                    .catch(() => {
                        // Error in check, default to moderate loading time
                        setTimeout(() => setIsLoading(false), 1000);
                    });
            } catch (error) {
                console.warn('AuthProvider session quick-check failed:', error);
                setTimeout(() => setIsLoading(false), 1000);
            }
        } else {
            // No stored session, but don't keep users waiting too long
            quickCheckTimer = setTimeout(() => {
                setIsLoading(false);
            }, 1500);
        }

        return () => {
            clearTimeout(maxLoadTimer);
            if (quickCheckTimer) clearTimeout(quickCheckTimer);
        };
    }, [disableOverlay]);

    return (
        <SessionProvider refetchInterval={60} refetchOnWindowFocus={true}>
            {isLoading ? (
                <div className="fixed inset-0 flex items-center justify-center bg-white bg-opacity-80 z-50">
                    <div className="flex flex-col items-center space-y-4">
                        <Loader2 className="h-12 w-12 text-blue-600 animate-spin" />
                        <p className="text-blue-600 font-medium text-lg">{loadingMessage}</p>
                    </div>
                </div>
            ) : children}
        </SessionProvider>
    );
}