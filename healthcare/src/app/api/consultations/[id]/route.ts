import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import ConsultationModel from '@/models/Consultation';
import mongoose from 'mongoose';

export const runtime = 'nodejs';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const resolvedParams = await params;
        const { id } = resolvedParams;

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: 'Invalid consultation ID' }, { status: 400 });
        }

        await connectToDatabase();

        // Find consultation by ID and ensure the user has access to it
        const consultation = await ConsultationModel.findOne({
            _id: id,
            $or: [
                { patientId: session.user.id },
                { providerId: session.user.id }
            ]
        })
        .populate('patientId', 'name email')
        .populate('providerId', 'name email specialty')
        .lean();

        if (!consultation) {
            return NextResponse.json({ error: 'Consultation not found' }, { status: 404 });
        }

        return NextResponse.json(consultation);
    } catch (error) {
        console.error('Error fetching consultation:', error);
        return NextResponse.json({ error: 'Failed to fetch consultation' }, { status: 500 });
    }
}

export async function PUT(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const resolvedParams = await params;
        const { id } = resolvedParams;
        const updateData: Record<string, unknown> = await request.json();

        if (!mongoose.Types.ObjectId.isValid(id)) {
            return NextResponse.json({ error: 'Invalid consultation ID' }, { status: 400 });
        }

        await connectToDatabase();

        // Find consultation and ensure the user has access to it
        const consultation = await ConsultationModel.findOne({
            _id: id,
            $or: [
                { patientId: session.user.id },
                { providerId: session.user.id }
            ]
        });

        if (!consultation) {
            return NextResponse.json({ error: 'Consultation not found' }, { status: 404 });
        }

        // Only providers can update certain fields
        const allowedFields = session.user.role === 'provider' 
            ? ['status', 'notes', 'diagnosis', 'prescriptions', 'followUp', 'rating']
            : ['rating']; // Patients can only update rating

        const filteredUpdate: Record<string, unknown> = {};
        for (const field of allowedFields) {
            if (updateData[field] !== undefined) {
                filteredUpdate[field] = updateData[field];
            }
        }

        const updatedConsultation = await ConsultationModel.findByIdAndUpdate(
            id,
            { ...filteredUpdate, updatedAt: new Date() },
            { new: true }
        )
        .populate('patientId', 'name email')
        .populate('providerId', 'name email specialty');

        return NextResponse.json(updatedConsultation);
    } catch (error) {
        console.error('Error updating consultation:', error);
        return NextResponse.json({ error: 'Failed to update consultation' }, { status: 500 });
    }
}

// This route is deprecated. Use /api/consultations/cancel instead.
export function DELETE() {
    return NextResponse.json(
        { message: 'This route is deprecated. Use /api/consultations/cancel instead.' },
        { status: 410 }
    );
}
