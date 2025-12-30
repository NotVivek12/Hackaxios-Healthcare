import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { checkBlockchainConnection } from '@/lib/blockchain';

export const runtime = 'nodejs';

/**
 * GET /api/health-records/blockchain-status
 * Check blockchain connection status and network info
 */
export async function GET(req: NextRequest) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const status = await checkBlockchainConnection();

        return NextResponse.json({
            connected: status.connected,
            network: status.network,
            blockNumber: status.blockNumber,
            walletAddress: status.walletAddress,
            contractAddress: process.env.BLOCKCHAIN_CONTRACT_ADDRESS,
            rpcUrl: process.env.BLOCKCHAIN_RPC_URL?.replace(/\/[^/]+$/, '/***'), // Hide API key
            error: status.error
        });

    } catch (error) {
        console.error('Blockchain status check error:', error);
        return NextResponse.json({
            connected: false,
            error: error instanceof Error ? error.message : 'Status check failed'
        }, { status: 500 });
    }
}
