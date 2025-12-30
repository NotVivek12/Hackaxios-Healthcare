import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import HealthRecordModel from '@/models/HealthRecord';
import {
    generateRecordHash,
    verifyRecordOnBlockchain,
    getRecordFromBlockchain,
    checkBlockchainConnection,
    formatBlockchainTimestamp,
    getExplorerUrl
} from '@/lib/blockchain';

export const runtime = 'nodejs';

/**
 * GET /api/health-records/verify/[id]
 * Verify a health record against blockchain
 */
export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        
        await connectDB();
        
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Find the record
        const record = await HealthRecordModel.findById(id);
        if (!record) {
            return NextResponse.json({ error: 'Record not found' }, { status: 404 });
        }

        // Check if user owns this record
        if (record.userId.toString() !== session.user.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Check blockchain connection
        const connectionStatus = await checkBlockchainConnection();
        if (!connectionStatus.connected) {
            return NextResponse.json({
                verified: false,
                error: 'Blockchain connection failed',
                details: connectionStatus.error
            }, { status: 503 });
        }

        // Check if record is on blockchain
        if (!record.isOnBlockchain || !record.blockchain?.recordHash) {
            return NextResponse.json({
                verified: false,
                isOnBlockchain: false,
                message: 'Record is not stored on blockchain'
            });
        }

        // Generate current hash from record data
        const currentHash = generateRecordHash({
            userId: record.userId.toString(),
            title: record.title,
            type: record.type,
            description: record.description,
            date: record.date.toISOString(),
            provider: record.provider,
            notes: record.notes
        });

        // Verify against blockchain
        const verificationResult = await verifyRecordOnBlockchain(
            record._id.toString(),
            currentHash
        );

        // Get blockchain record details
        const blockchainRecord = await getRecordFromBlockchain(record._id.toString());

        // Update last verified timestamp
        if (verificationResult.isValid) {
            record.blockchain.lastVerifiedAt = new Date();
            record.blockchain.verified = true;
            await record.save();
        }

        return NextResponse.json({
            verified: verificationResult.isValid,
            isOnBlockchain: true,
            tamperDetected: !verificationResult.isValid && blockchainRecord.exists,
            blockchain: {
                transactionHash: record.blockchain.transactionHash,
                blockNumber: record.blockchain.blockNumber,
                storedAt: record.blockchain.storedAt,
                explorerUrl: getExplorerUrl(record.blockchain.transactionHash),
                blockchainTimestamp: verificationResult.storedTimestamp 
                    ? formatBlockchainTimestamp(verificationResult.storedTimestamp)
                    : null,
                isRevoked: verificationResult.isRevoked
            },
            verification: {
                currentHash,
                storedHash: record.blockchain.recordHash,
                hashesMatch: currentHash === record.blockchain.recordHash,
                lastVerifiedAt: new Date()
            },
            network: connectionStatus.network
        });

    } catch (error) {
        console.error('Verification error:', error);
        return NextResponse.json(
            { error: 'Verification failed', details: error instanceof Error ? error.message : 'Unknown error' },
            { status: 500 }
        );
    }
}
