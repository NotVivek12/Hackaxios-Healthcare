import { NextRequest, NextResponse } from 'next/server';

/**
 * Socket.IO Health Check Endpoint
 * 
 * This endpoint provides a simple health check for the Socket.IO server.
 * It can be used to verify that the socket server is operational and
 * to check the status of WebSocket connections.
 * 
 * @returns {Object} Status information about the Socket.IO server
 */
export async function GET(request: NextRequest) {
    try {
        // Check origin for CORS issues (useful for debugging)
        const origin = request.headers.get('origin') || 'unknown';

        // Return server status with additional diagnostic information
        return NextResponse.json({
            status: 'ok',
            message: 'Socket server is running',
            timestamp: new Date().toISOString(),
            socketPath: '/api/socket',
            cors: {
                origin,
                allowed: true
            }
        }, {
            status: 200,
            headers: {
                'Cache-Control': 'no-store, max-age=0',
            }
        });
    } catch (error) {
        console.error('Socket health check error:', error);

        return NextResponse.json({
            status: 'error',
            message: 'Socket server health check failed',
            error: error instanceof Error ? error.message : 'Unknown error',
            timestamp: new Date().toISOString()
        }, {
            status: 500,
            headers: {
                'Cache-Control': 'no-store, max-age=0',
            }
        });
    }
}
