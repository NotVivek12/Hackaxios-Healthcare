import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import type { Types } from 'mongoose';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { ApiError } from '@/lib/api-error';

export async function GET() {
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

        // Get the assigned provider if any
        let assignedProvider = null;
        if (currentUser.assignedProvider) {
            assignedProvider = await User.findById(currentUser.assignedProvider)
                .select('name profile.specialty profile.yearsExperience profile.bio profile.averageRating')
                .lean();
        }

        return NextResponse.json({
            patientId: currentUser._id,
            assignedProvider
        });
    } catch (error) {
        console.error('Error fetching patient provider:', error);
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

        // If patient already has a provider, remove them from that provider's list
        if (currentUser.assignedProvider) {
            const previousProvider = await User.findById(currentUser.assignedProvider);
            if (previousProvider) {
                const previousIds = (previousProvider.patients as Types.ObjectId[] | undefined) ?? [];
                previousProvider.patients = previousIds.filter((id: Types.ObjectId) => id.toString() !== currentUser._id.toString());
                await previousProvider.save();
            }
        }

        // Update patient with assigned provider
        currentUser.assignedProvider = providerId;

        // Add patient to provider's patients array if not already there
        const providerPatientIds = (provider.patients as Types.ObjectId[] | undefined) ?? [];
        if (!providerPatientIds.some((id) => id.toString() === currentUser._id.toString())) {
            providerPatientIds.push(currentUser._id as Types.ObjectId);
        }
        provider.patients = providerPatientIds;

        // Save both documents
        await Promise.all([
            currentUser.save(),
            provider.save()
        ]);

        return NextResponse.json({
            success: true,
            message: 'Provider selected successfully',
            provider: {
                id: provider._id,
                name: provider.name,
                specialty: provider.profile?.specialty
            }
        });
    } catch (error) {
        console.error('Error selecting provider:', error);
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
