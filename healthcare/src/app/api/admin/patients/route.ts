import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import dbConnect from '@/lib/mongodb';
import User from '@/models/User';
import { ApiError } from '@/lib/api-error';

export async function GET(req: NextRequest) {
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

        // Get filter parameters from URL
        const searchParams = req.nextUrl.searchParams;
        const search = searchParams.get('search') || '';
        const filter = searchParams.get('filter') || 'all';

        // Build query
        const query: Record<string, unknown> = { role: 'patient' };

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ];
        }

        if (filter === 'assigned') {
            query.assignedProvider = { $exists: true, $ne: null };
        } else if (filter === 'unassigned') {
            query.assignedProvider = { $exists: false };
        }

        // Get patients with their assigned providers
        const patients = await User.find(query)
            .select('name email assignedProvider providerRequests')
            .populate('assignedProvider', 'name profile.specialty')
            .lean();

        // Get totals for the filters
        const totalPatients = await User.countDocuments({ role: 'patient' });
        const totalAssigned = await User.countDocuments({
            role: 'patient',
            assignedProvider: { $exists: true, $ne: null }
        });
        const totalUnassigned = totalPatients - totalAssigned;

        return NextResponse.json({
            patients,
            counts: {
                all: totalPatients,
                assigned: totalAssigned,
                unassigned: totalUnassigned
            }
        });
    } catch (error) {
        console.error('Error fetching patients:', error);
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
