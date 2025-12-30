import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import HealthRecordModel from '@/models/HealthRecord';
import { 
    generateRecordHash, 
    storeRecordOnBlockchain, 
    getExplorerUrl 
} from '@/lib/blockchain';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;

        // Get query parameters
        const searchParams = req.nextUrl.searchParams;
        const type = searchParams.get('type');
        const query = searchParams.get('q');
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '20');

        // Build filter
        const filter: {
            userId: string;
            type?: string;
        } = { userId: userId || '' };
        if (type) {
            filter.type = type;
        }

        // Text search if query is provided
        let records;
        if (query) {
            records = await HealthRecordModel.find(
                {
                    userId,
                    $text: { $search: query }
                },
                {
                    score: { $meta: "textScore" }
                }
            )
                .sort({ score: { $meta: "textScore" }, date: -1 })
                .skip((page - 1) * limit)
                .limit(limit);
        } else {
            records = await HealthRecordModel.find(filter)
                .sort({ date: -1 })
                .skip((page - 1) * limit)
                .limit(limit);
        }

        const total = await HealthRecordModel.countDocuments(filter);

        return NextResponse.json({
            records,
            pagination: {
                total,
                page,
                limit,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error) {
        console.error('Error fetching health records:', error);
        return NextResponse.json({ error: 'Failed to fetch health records' }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;
        const data = await req.json();

        // Validate required fields
        if (!data.title || !data.type || !data.description || !data.date) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Create new health record
        const newRecord = await HealthRecordModel.create({
            userId,
            title: data.title,
            type: data.type,
            description: data.description,
            date: new Date(data.date),
            provider: data.provider,
            attachmentUrl: data.attachmentUrl,
            isShared: data.isShared || false,
            notes: data.notes,
            isOnBlockchain: false
        });

        // Store on blockchain for tamper-proof verification
        let blockchainResult = null;
        try {
            const recordHash = generateRecordHash({
                userId: userId || '',
                title: data.title,
                type: data.type,
                description: data.description,
                date: new Date(data.date).toISOString(),
                provider: data.provider,
                notes: data.notes
            });

            const blockchainResponse = await storeRecordOnBlockchain(
                newRecord._id.toString(),
                recordHash
            );

            if (blockchainResponse.success) {
                // Update record with blockchain info
                newRecord.blockchain = {
                    transactionHash: blockchainResponse.transactionHash!,
                    blockNumber: blockchainResponse.blockNumber!,
                    recordHash: recordHash,
                    storedAt: new Date(),
                    verified: true,
                    lastVerifiedAt: new Date()
                };
                newRecord.isOnBlockchain = true;
                await newRecord.save();

                blockchainResult = {
                    success: true,
                    transactionHash: blockchainResponse.transactionHash,
                    explorerUrl: getExplorerUrl(blockchainResponse.transactionHash!)
                };
            } else {
                console.warn('Blockchain storage failed:', blockchainResponse.error);
                blockchainResult = {
                    success: false,
                    error: blockchainResponse.error
                };
            }
        } catch (blockchainError) {
            console.error('Blockchain error (non-fatal):', blockchainError);
            blockchainResult = {
                success: false,
                error: 'Blockchain storage failed, record saved to database only'
            };
        }

        return NextResponse.json({
            ...newRecord.toObject(),
            blockchainResult
        }, { status: 201 });
    } catch (error) {
        console.error('Error creating health record:', error);
        return NextResponse.json({ error: 'Failed to create health record' }, { status: 500 });
    }
}
