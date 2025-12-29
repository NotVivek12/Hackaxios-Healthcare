import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { ApiError } from '@/lib/api-error';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession();

        if (!session?.user) {
            throw new ApiError('Unauthorized', 401);
        }

        // Fetch the current user to check if they're an admin
        await dbConnect();
        const currentUser = await User.findOne({ email: session.user.email });

        if (!currentUser || currentUser.role !== 'admin') {
            throw new ApiError('Forbidden: Admin access required', 403);
        }

        const { patientId, providerId } = await req.json();

        if (!patientId || !providerId) {
            throw new ApiError('Patient ID and Provider ID are required', 400);
        }

        // Check if patient and provider exist
        const patient = await User.findById(patientId);
        const provider = await User.findById(providerId);

        if (!patient) {
            throw new ApiError('Patient not found', 404);
        }

        if (!provider) {
            throw new ApiError('Provider not found', 404);
        }

        if (patient.role !== 'patient') {
            throw new ApiError('Selected user is not a patient', 400);
        }

        if (provider.role !== 'provider') {
            throw new ApiError('Selected user is not a provider', 400);
        }

        // Update patient with assigned provider
        patient.assignedProvider = providerId;

        // Add patient to provider's patients array if not already there
        if (!provider.patients.includes(patientId)) {
            provider.patients.push(patientId);
        }

        // Save both documents
        await Promise.all([
            patient.save(),
            provider.save()
        ]);

        return NextResponse.json({
            success: true,
            message: 'Provider assigned successfully',
            patient: {
                id: patient._id,
                name: patient.name,
                email: patient.email,
                assignedProvider: {
                    id: provider._id,
                    name: provider.name,
                    specialty: provider.profile?.specialty
                }
            }
        });
    } catch (error) {
        console.error('Error assigning provider:', error);
        if (error instanceof ApiError) {
            return NextResponse.json(
                { error: error.message },
                { status: error.statusCode }
            );
        }
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}
