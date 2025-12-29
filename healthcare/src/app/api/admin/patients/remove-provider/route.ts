import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import type { Types } from 'mongoose';
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

        const { patientId } = await req.json();

        if (!patientId) {
            throw new ApiError('Patient ID is required', 400);
        }

        // Check if patient exists
        const patient = await User.findById(patientId);

        if (!patient) {
            throw new ApiError('Patient not found', 404);
        }

        if (patient.role !== 'patient') {
            throw new ApiError('Selected user is not a patient', 400);
        }

        if (!patient.assignedProvider) {
            return NextResponse.json({
                success: true,
                message: 'Patient already has no assigned provider'
            });
        }

        // Get the provider to remove the patient from their list
        const provider = await User.findById(patient.assignedProvider);

        // Update patient to remove assigned provider
        patient.assignedProvider = undefined;
        await patient.save();

        // If provider exists, remove patient from their list
        if (provider) {
            const patientIds = (provider.patients as Types.ObjectId[] | undefined) ?? [];
            provider.patients = patientIds.filter((id: Types.ObjectId) => id.toString() !== patientId);
            await provider.save();
        }

        return NextResponse.json({
            success: true,
            message: 'Provider assignment removed successfully',
            patient: {
                id: patient._id,
                name: patient.name,
                email: patient.email
            }
        });
    } catch (error) {
        console.error('Error removing provider assignment:', error);
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
