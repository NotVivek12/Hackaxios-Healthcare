import { NextResponse } from 'next/server';

/**
 * Health Check API Endpoint
 * 
 * This endpoint provides a simple health check for monitoring tools,
 * load balancers, and container orchestration systems to verify that
 * the application is running properly.
 * 
 * @returns {Object} Status information about the application
 */
export async function GET() {
    try {
        // Get basic system information
        const uptime = process.uptime();
        const memory = process.memoryUsage();
        const nodeVersion = process.version;

        // Format memory usage in MB
        const formattedMemory = {
            rss: Math.round(memory.rss / 1024 / 1024),
            heapTotal: Math.round(memory.heapTotal / 1024 / 1024),
            heapUsed: Math.round(memory.heapUsed / 1024 / 1024),
            external: Math.round(memory.external / 1024 / 1024),
        };

        // Return status with system information
        return NextResponse.json({
            status: 'ok',
            message: 'Service is healthy',
            timestamp: new Date().toISOString(),
            version: process.env.npm_package_version || 'unknown',
            uptime: `${Math.floor(uptime / 3600)}h ${Math.floor((uptime % 3600) / 60)}m ${Math.floor(uptime % 60)}s`,
            environment: process.env.NODE_ENV || 'development',
            memory: `${formattedMemory.heapUsed}MB / ${formattedMemory.heapTotal}MB`,
            node: nodeVersion,
        }, {
            status: 200,
            headers: {
                'Cache-Control': 'no-store, max-age=0',
            }
        });
    } catch (error) {
        console.error('Health check error:', error);

        return NextResponse.json({
            status: 'error',
            message: 'Health check failed',
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
