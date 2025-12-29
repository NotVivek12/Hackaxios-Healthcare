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

        if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'patient')) {
            throw new ApiError('Forbidden: Admin or patient access required', 403);
        }

        // Get search and filter parameters
        const searchParams = req.nextUrl.searchParams;
        const search = searchParams.get('search') || '';
        const specialty = searchParams.get('specialty') || '';

        // Build query
        const query: Record<string, unknown> = { role: 'provider' };

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { 'profile.specialty': { $regex: search, $options: 'i' } }
            ];
        }

        if (specialty && specialty !== 'all') {
            query['profile.specialty'] = specialty;
        }

        // Get providers with their patient count
        const providers = await User.find(query)
            .select('name profile.specialty profile.yearsExperience profile.bio profile.averageRating')
            .lean();

        // Get patient counts for each provider
        const providersWithCounts = await Promise.all(
            providers.map(async (provider) => {
                const patientCount = await User.countDocuments({
                    assignedProvider: provider._id
                });

                return {
                    ...provider,
                    patientCount
                };
            })
        );

        // Get all available specialties for filtering
        const specialties = await User.distinct('profile.specialty', {
            role: 'provider',
            'profile.specialty': { $exists: true, $ne: '' }
        });

        return NextResponse.json({
            providers: providersWithCounts,
            specialties
        });
    } catch (error) {
        console.error('Error fetching providers:', error);
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
