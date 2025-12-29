import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
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

        // Fetch the current user
        await dbConnect();
        const currentUser = await User.findOne({ email: session.user.email });

        if (!currentUser || currentUser.role !== 'patient') {
            throw new ApiError('Forbidden: Patient access required', 403);
        }

        const { providerId } = await req.json();

        if (!providerId) {
            throw new ApiError('Provider ID is required', 400);
        }

        // Check if provider exists
        const provider = await User.findById(providerId);

        if (!provider) {
            throw new ApiError('Provider not found', 404);
        }

        if (provider.role !== 'provider') {
            throw new ApiError('Selected user is not a provider', 400);
        }

        // Check if patient already has a pending request for this provider
        const existingRequestIndex = currentUser.providerRequests?.findIndex(
            (request: { provider: mongoose.Types.ObjectId; status: string; requestDate: Date }) =>
                request.provider.toString() === providerId
        );

        if (existingRequestIndex !== -1 && existingRequestIndex !== undefined) {
            // If the request is rejected, allow resubmitting
            if (currentUser.providerRequests[existingRequestIndex].status === 'rejected') {
                currentUser.providerRequests[existingRequestIndex].status = 'pending';
                currentUser.providerRequests[existingRequestIndex].requestDate = new Date();
            } else {
                throw new ApiError('You already have a pending or approved request for this provider', 400);
            }
        } else {
            // Add new request
            if (!currentUser.providerRequests) {
                currentUser.providerRequests = [];
            }

            currentUser.providerRequests.push({
                provider: providerId,
                status: 'pending',
                requestDate: new Date()
            });
        }

        await currentUser.save();

        return NextResponse.json({
            success: true,
            message: 'Provider request submitted successfully',
            provider: {
                id: provider._id,
                name: provider.name,
                specialty: provider.profile?.specialty
            }
        });
    } catch (error) {
        console.error('Error requesting provider:', error);
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
