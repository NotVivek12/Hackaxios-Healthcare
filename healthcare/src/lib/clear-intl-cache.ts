'use client';

/**
 * Utility to clear cached data related to internationalization.
 * This can help resolve issues where language changes aren't being
 * reflected in the UI.
 */
export function clearIntlCache() {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        // Clear any cache keys that might be related to intl/translations
        const cacheKeys = Object.keys(localStorage).filter(key =>
            key.includes('intl') ||
            key.includes('locale') ||
            key.includes('lang') ||
            key.includes('i18n')
        );

        // Log what we're removing
        if (cacheKeys.length > 0) {
            console.log('Clearing intl-related cache keys:', cacheKeys);
            cacheKeys.forEach(key => {
                localStorage.removeItem(key);
            });
        }

        // Keep preferredLocale - we want to keep the user's preference
        // but just force a refresh of the actual translations

        // Clear any potential service worker caches
        if ('caches' in window) {
            caches.keys().then(cacheNames => {
                cacheNames.forEach(cacheName => {
                    if (cacheName.includes('next-intl') || cacheName.includes('i18n')) {
                        caches.delete(cacheName);
                    }
                });
            });
        }

        console.log('Intl cache cleared successfully');
    } catch (error) {
        console.error('Error clearing intl cache:', error);
    }
}

/**
 * Force reload the page with a cache-busting parameter
 * to ensure fresh translations are loaded
 */
export function forceTranslationRefresh() {
    if (typeof window === 'undefined') {
        return;
    }

    try {
        // First try to call the server-side refresh API
        const currentLocale = localStorage.getItem('preferredLocale') || 'en';
        fetch(`/api/locale?locale=${currentLocale}&_t=${Date.now()}`)
            .then(res => res.json())
            .then(data => {
                console.log('Server-side translation refresh result:', data);
            })
            .catch(err => {
                console.error('Failed to refresh translations server-side:', err);
            })
            .finally(() => {
                // Then refresh the client
                // Add a timestamp parameter to bust cache
                const url = new URL(window.location.href);
                url.searchParams.set('_i18n_refresh', Date.now().toString());

                // Replace the current URL without adding to history
                window.location.replace(url.toString());
            });
    } catch (error) {
        console.error('Error forcing translation refresh:', error);
        // Fallback to simple reload
        window.location.reload();
    }
}
