import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';

/**
 * API endpoint to quickly check session status
 * This helps with faster authentication state determination
 */
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        // Return minimal session data for quick checks
        return NextResponse.json({
            authenticated: !!session,
            user: session?.user ? {
                name: session.user.name,
                email: session.user.email,
            } : null,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Session check error:', error);
        return NextResponse.json({
            authenticated: false,
            error: 'Failed to check session',
        }, { status: 500 });
    }
}

// Ensure Node.js runtime for compatibility with NextAuth
export const runtime = 'nodejs';
