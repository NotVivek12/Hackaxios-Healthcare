import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import HealthRecordModel from '@/models/HealthRecord';
import mongoose from 'mongoose';

export const runtime = 'nodejs';

// Handle GET for a specific health record
export async function GET(req: NextRequest) {
    try {
        await connectDB();
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;

        // Get record ID from URL path
        const url = new URL(req.url);
        const pathParts = url.pathname.split('/');
        const recordId = pathParts[pathParts.length - 1];

        // Validate ID format
        if (!mongoose.Types.ObjectId.isValid(recordId)) {
            return NextResponse.json({ error: 'Invalid record ID' }, { status: 400 });
        }

        // Find the health record
        const record = await HealthRecordModel.findOne({
            _id: recordId,
            userId
        });

        if (!record) {
            return NextResponse.json({ error: 'Health record not found' }, { status: 404 });
        }

        return NextResponse.json(record);
    } catch (error) {
        console.error('Error fetching health record:', error);
        return NextResponse.json({ error: 'Failed to fetch health record' }, { status: 500 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;

        // Get record ID from URL path
        const url = new URL(req.url);
        const pathParts = url.pathname.split('/');
        const recordId = pathParts[pathParts.length - 1];

        const data = await req.json();

        // Validate ID format
        if (!mongoose.Types.ObjectId.isValid(recordId)) {
            return NextResponse.json({ error: 'Invalid record ID' }, { status: 400 });
        }

        // Ensure required fields
        if (!data.title || !data.type || !data.description || !data.date) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Find and update the health record
        const updatedRecord = await HealthRecordModel.findOneAndUpdate(
            {
                _id: recordId,
                userId
            },
            {
                title: data.title,
                type: data.type,
                description: data.description,
                date: new Date(data.date),
                provider: data.provider,
                attachmentUrl: data.attachmentUrl,
                isShared: data.isShared !== undefined ? data.isShared : false,
                notes: data.notes
            },
            { new: true }
        );

        if (!updatedRecord) {
            return NextResponse.json({ error: 'Health record not found' }, { status: 404 });
        }

        return NextResponse.json(updatedRecord);
    } catch (error) {
        console.error('Error updating health record:', error);
        return NextResponse.json({ error: 'Failed to update health record' }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        // Check authentication
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const userId = session.user.id;

        // Get record ID from URL path
        const url = new URL(req.url);
        const pathParts = url.pathname.split('/');
        const recordId = pathParts[pathParts.length - 1];

        // Validate ID format
        if (!mongoose.Types.ObjectId.isValid(recordId)) {
            return NextResponse.json({ error: 'Invalid record ID' }, { status: 400 });
        }

        // Find and delete the health record
        const result = await HealthRecordModel.findOneAndDelete({
            _id: recordId,
            userId
        });

        if (!result) {
            return NextResponse.json({ error: 'Health record not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Health record deleted successfully' });
    } catch (error) {
        console.error('Error deleting health record:', error);
        return NextResponse.json({ error: 'Failed to delete health record' }, { status: 500 });
    }
}
