import createNextIntlPlugin from 'next-intl/plugin';
import type { NextConfig } from 'next';

// Point to i18n.ts at project root (keeps messages co-located and avoids bundling issues)
const withNextIntl = createNextIntlPlugin('./i18n.ts');

const nextConfig: NextConfig = {
    // Force SWC transpilation even when Babel config exists
    experimental: {
        forceSwcTransforms: true,
    },

    // Do not fail the production build on ESLint errors (Vercel/CI)
    eslint: {
        ignoreDuringBuilds: true,
    },

    // Configure redirects for common issues
    async redirects() {
        return [
            // Redirect test-translations without locale to English version
            {
                source: '/test-translations',
                destination: '/en/test-translations',
                permanent: false,
            },
            // Redirect auth without locale to English version
            {
                source: '/auth/signin',
                destination: '/en/auth/signin',
                permanent: false,
            },
            // Static fallback page
            {
                source: '/static-test',
                destination: '/static-fallback.html',
                permanent: false,
            },
            // Removed legacy /fallback -> /test-fallback redirect to prevent prerender/export errors
            // If a page is not found, try the English version
            {
                source: '/:path*',
                has: [
                    {
                        type: 'header',
                        key: 'x-not-found',
                        value: 'true',
                    },
                ],
                destination: '/en/:path*',
                permanent: false,
            },
        ];
    }
};

export default withNextIntl(nextConfig);
