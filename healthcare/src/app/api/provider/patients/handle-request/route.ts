import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import mongoose from 'mongoose';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { ApiError } from '@/lib/api-error';

export async function POST(req: NextRequest) {
    try {
        const session = await getServerSession();

        if (!session?.user) {
            throw new ApiError('Unauthorized', 401);
        }

        // Fetch the current user to check if they're a provider
        await dbConnect();
        const currentUser = await User.findOne({ email: session.user.email });

        if (!currentUser || currentUser.role !== 'provider') {
            throw new ApiError('Forbidden: Provider access required', 403);
        }

        const { patientId, action } = await req.json();

        if (!patientId || !action) {
            throw new ApiError('Patient ID and action are required', 400);
        }

        if (action !== 'accept' && action !== 'decline') {
            throw new ApiError('Invalid action. Must be "accept" or "decline"', 400);
        }

        // Check if patient exists
        const patient = await User.findById(patientId);

        if (!patient) {
            throw new ApiError('Patient not found', 404);
        }

        // Find the request in the patient's requests array
        const requestIndex = patient.providerRequests?.findIndex(
            (request: { provider: mongoose.Types.ObjectId; status: string; requestDate: Date }) =>
                request.provider.toString() === currentUser._id.toString()
        );

        if (requestIndex === -1 || requestIndex === undefined) {
            throw new ApiError('No pending request found for this patient', 404);
        }

        if (action === 'accept') {
            // Update the request status
            patient.providerRequests[requestIndex].status = 'approved';

            // Assign provider to patient
            patient.assignedProvider = currentUser._id;

            // Add patient to provider's list if not already there
            if (!currentUser.patients.includes(patient._id)) {
                currentUser.patients.push(patient._id);
            }

            await Promise.all([patient.save(), currentUser.save()]);

            return NextResponse.json({
                success: true,
                message: 'Patient request accepted',
                patient: {
                    id: patient._id,
                    name: patient.name,
                    email: patient.email
                }
            });
        } else {
            // Update the request status to rejected
            patient.providerRequests[requestIndex].status = 'rejected';
            await patient.save();

            return NextResponse.json({
                success: true,
                message: 'Patient request declined',
                patient: {
                    id: patient._id,
                    name: patient.name,
                    email: patient.email
                }
            });
        }
    } catch (error) {
        console.error('Error handling patient request:', error);
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
