import createMiddleware from 'next-intl/middleware';
import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';

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

// Public routes that don't require authentication
const publicRoutes = [
    '/auth/signin',
    '/auth/signup',
    '/api/auth',
];

// Routes that require specific roles
const providerOnlyRoutes = ['/provider'];
const patientOnlyRoutes = ['/dashboard']; // Only patient dashboard, not /meetings
const sharedRoutes = ['/meetings', '/consultations']; // Both roles can access

// Simple wrapper to handle any custom logic before passing to next-intl middleware
export default async function middleware(request: NextRequest) {
    // Get the pathname
    const { pathname } = request.nextUrl;

    // Create a log of the request for debugging
    console.log(`Middleware processing: ${pathname}`);

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
        return NextResponse.next();
    }

    // Check if it's a public route (signin/signup)
    const isPublicRoute = publicRoutes.some(route => pathname.includes(route));
    
    // Get the locale from the path
    const pathSegments = pathname.split('/').filter(Boolean);
    const locales = ['en', 'es', 'fr', 'hi', 'pt', 'sw', 'ar'];
    const firstSegment = pathSegments[0] || '';
    const locale = locales.includes(firstSegment) ? firstSegment : 'en';
    const pathWithoutLocale = locales.includes(firstSegment) 
        ? '/' + pathSegments.slice(1).join('/')
        : '/' + pathSegments.join('/');

    // REQUIRE AUTHENTICATION FOR ALL ROUTES (including home page)
    if (!isPublicRoute) {
        try {
            const token = await getToken({ 
                req: request, 
                secret: process.env.NEXTAUTH_SECRET 
            });

            if (!token) {
                // Redirect to signin if not authenticated
                const signInUrl = new URL(`/${locale}/auth/signin`, request.url);
                signInUrl.searchParams.set('callbackUrl', pathname);
                return NextResponse.redirect(signInUrl);
            }

            // Check role-based access
            const userRole = token.role as string;

            // Redirect from home page to appropriate dashboard
            if (pathWithoutLocale === '' || pathWithoutLocale === '/') {
                const dashboardUrl = userRole === 'provider' 
                    ? `/${locale}/provider/dashboard`
                    : `/${locale}/dashboard`;
                return NextResponse.redirect(new URL(dashboardUrl, request.url));
            }

            // Provider trying to access patient-only routes (like /dashboard)
            if (userRole === 'provider' && patientOnlyRoutes.some(route => pathWithoutLocale === route || pathWithoutLocale.startsWith(route + '/'))) {
                const providerDashboard = new URL(`/${locale}/provider/dashboard`, request.url);
                return NextResponse.redirect(providerDashboard);
            }

            // Patient trying to access provider-only routes
            if (userRole === 'patient' && providerOnlyRoutes.some(route => pathWithoutLocale.startsWith(route))) {
                const patientDashboard = new URL(`/${locale}/dashboard`, request.url);
                return NextResponse.redirect(patientDashboard);
            }
        } catch (error) {
            console.error('Auth check error:', error);
            // On error, redirect to signin
            const signInUrl = new URL(`/${locale}/auth/signin`, request.url);
            return NextResponse.redirect(signInUrl);
        }
    }

    // If authenticated user tries to access auth pages, redirect to appropriate dashboard
    if (isPublicRoute) {
        try {
            const token = await getToken({ 
                req: request, 
                secret: process.env.NEXTAUTH_SECRET 
            });

            if (token) {
                const userRole = token.role as string;
                const dashboardUrl = userRole === 'provider' 
                    ? `/${locale}/provider/dashboard`
                    : `/${locale}/dashboard`;
                return NextResponse.redirect(new URL(dashboardUrl, request.url));
            }
        } catch (error) {
            console.error('Auth redirect error:', error);
        }
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
