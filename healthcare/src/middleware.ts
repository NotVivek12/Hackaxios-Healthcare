import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Create the next-intl middleware
const intlMiddleware = createMiddleware({
    locales: ['en', 'es', 'fr', 'hi', 'pt', 'sw', 'ar'],
    defaultLocale: 'en',
    localePrefix: 'always',
    localeDetection: true
});

// Pages that anyone can access (no login required)
const publicPages = [
    '/',  // Home/landing page
    '/auth/signin',
    '/auth/signup',
];

// Pages only for doctors/providers
const providerOnlyPages = [
    '/provider',
    '/provider/dashboard',
    '/provider/patients',
];

// Pages only for patients
const patientOnlyPages = [
    '/dashboard',
    '/meetings/schedule',
    '/symptom-checker',
    '/health-records',
];

export default async function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Skip for API, static files, etc.
    if (
        pathname.startsWith('/api/') ||
        pathname.startsWith('/_next') ||
        pathname.startsWith('/static') ||
        pathname.includes('.') ||
        pathname === '/favicon.ico'
    ) {
        return NextResponse.next();
    }

    // Get locale info
    const pathSegments = pathname.split('/').filter(Boolean);
    const locales = ['en', 'es', 'fr', 'hi', 'pt', 'sw', 'ar'];
    const firstSegment = pathSegments[0] || '';
    const locale = locales.includes(firstSegment) ? firstSegment : 'en';
    const pathWithoutLocale = locales.includes(firstSegment) 
        ? '/' + pathSegments.slice(1).join('/')
        : pathname;

    // Normalize empty path
    const normalizedPath = pathWithoutLocale === '' ? '/' : pathWithoutLocale;

    // Check if this is a public page
    const isPublicPage = publicPages.includes(normalizedPath);

    // Check if page requires specific role
    const isProviderPage = providerOnlyPages.some(page => normalizedPath.startsWith(page));
    const isPatientPage = patientOnlyPages.some(page => normalizedPath.startsWith(page));

    // Get auth token
    let token = null;
    try {
        token = await getToken({ 
            req: request, 
            secret: process.env.NEXTAUTH_SECRET,
            secureCookie: process.env.NODE_ENV === 'production'
        });
    } catch (error) {
        console.error('Token error:', error);
    }

    const isLoggedIn = !!token;
    const userRole = token?.role as string || 'patient';

    // PUBLIC PAGES: Anyone can access
    if (isPublicPage) {
        // If user is on signin/signup and already logged in, redirect to their dashboard
        if (isLoggedIn && (normalizedPath === '/auth/signin' || normalizedPath === '/auth/signup')) {
            const dashboardUrl = userRole === 'provider' 
                ? `/${locale}/provider/dashboard`
                : `/${locale}/dashboard`;
            return NextResponse.redirect(new URL(dashboardUrl, request.url));
        }
        // Otherwise let them view the page (including home page for everyone)
        return intlMiddleware(request);
    }

    // PROTECTED PAGES: Must be logged in
    if (!isLoggedIn) {
        const signInUrl = new URL(`/${locale}/auth/signin`, request.url);
        signInUrl.searchParams.set('callbackUrl', pathname);
        return NextResponse.redirect(signInUrl);
    }

    // PROVIDER-ONLY PAGES: Redirect patients away
    if (isProviderPage && userRole !== 'provider') {
        return NextResponse.redirect(new URL(`/${locale}/dashboard`, request.url));
    }

    // PATIENT-ONLY PAGES: Redirect providers away
    if (isPatientPage && userRole === 'provider') {
        return NextResponse.redirect(new URL(`/${locale}/provider/dashboard`, request.url));
    }

    // All checks passed, proceed
    return intlMiddleware(request);
}

export const config = {
    matcher: ['/((?!api|_next|_vercel|favicon.ico|.*\\.(?:jpg|jpeg|gif|png|svg|webp)).*)']
};
