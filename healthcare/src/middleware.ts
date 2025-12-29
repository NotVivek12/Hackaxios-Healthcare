import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';

// Create the next-intl middleware with more permissive config
const intlMiddleware = createMiddleware({
    // A list of all locales that are supported
    locales: ['en', 'es', 'fr', 'hi', 'pt', 'sw', 'ar'],

    // Used when no locale matches
    defaultLocale: 'en',

    // Add localePrefix to always enforce locale in URL
    localePrefix: 'always',

    // Detect locale from headers and cookies
    localeDetection: true
});

// Simple wrapper to handle any custom logic before passing to next-intl middleware
export default function middleware(request: NextRequest) {
    // Get the pathname
    const { pathname } = request.nextUrl;

    // Create a log of the request for debugging
    console.log(`Middleware processing: ${pathname}`);

    // Removed legacy test-fallback bypass

    // Skip middleware for API routes, static files, and other excluded paths
    if (
        pathname.startsWith('/api/') ||
        pathname.includes('/api/auth') ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/static') ||
        pathname.includes('.') || // Files with extensions
        pathname === '/static-fallback.html' ||
        pathname === '/static-test'
    ) {
        console.log('Bypassing middleware for excluded path');
        return NextResponse.next();
    }

    // For all other routes, use the intl middleware
    return intlMiddleware(request);
}

export const config = {
    // Match all routes except Next.js specific routes and API routes
    matcher: [
        // Match all paths except:
        // - API routes (/api/...)
        // - Next.js internals (_next/...)
        // - Static files (including favicon.ico, images, etc)
    '/((?!api|_next|_vercel|static-fallback\\.html|static-test|favicon.ico|.*\\.(?:jpg|jpeg|gif|png|svg|webp)).*)'
    ]
};
