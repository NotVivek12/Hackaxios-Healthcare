import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

/**
 * API endpoint to refresh translations cache and improve performance
 * 
 * This can be called to clear server-side caches when needed
 */
export async function GET(request: Request) {
    try {
        // Get requested locale from query
        const url = new URL(request.url);
        const locale = url.searchParams.get('locale') || '';
        const path = url.searchParams.get('path') || '';

        // Revalidate the entire path or specific locale paths
        if (path) {
            // Revalidate specific path
            revalidatePath(path);
            console.log(`Revalidated path: ${path}`);
        } else if (locale) {
            // Revalidate locale-specific paths
            revalidatePath(`/${locale}`);
            revalidatePath(`/${locale}/dashboard`);
            revalidatePath(`/${locale}/auth`);
            console.log(`Revalidated paths for locale: ${locale}`);
        } else {
            // Revalidate all important paths
            revalidatePath('/');
            ['en', 'es', 'fr', 'pt', 'ar', 'hi', 'sw'].forEach(l => {
                revalidatePath(`/${l}`);
                revalidatePath(`/${l}/dashboard`);
            });
            console.log('Revalidated all primary paths');
        }

        // Return success response
        return NextResponse.json({
            success: true,
            message: `Cache revalidation completed for locale: ${locale || 'all'} and path: ${path || 'all primary paths'}`,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error refreshing translations:', error);
        return NextResponse.json({
            success: false,
            error: 'Failed to refresh translations'
        }, { status: 500 });
    }
}
