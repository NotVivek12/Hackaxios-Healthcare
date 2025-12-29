import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import ConsultationModel from '@/models/Consultation';

export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const data = await request.json();
        const consultationId = data.id;

        if (!consultationId) {
            return NextResponse.json({ error: 'Consultation ID is required' }, { status: 400 });
        }

        // Connect to the database
        await connectToDatabase();

        // Find the consultation
        const consultation = await ConsultationModel.findById(consultationId);

        if (!consultation) {
            return NextResponse.json({ error: 'Consultation not found' }, { status: 404 });
        }

        // Verify that the user owns this consultation
        if (consultation.patientId.toString() !== session.user.id) {
            return NextResponse.json({ error: 'Unauthorized to cancel this consultation' }, { status: 403 });
        }

        // Update the consultation status to cancelled
        consultation.status = 'cancelled';
        await consultation.save();

        return NextResponse.json({ message: 'Consultation cancelled successfully' });
    } catch (error) {
        console.error('Error cancelling consultation:', error);
        return NextResponse.json({ error: 'Failed to cancel consultation' }, { status: 500 });
    }
}
