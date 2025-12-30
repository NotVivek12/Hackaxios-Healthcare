import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import User from '@/models/User';

export const runtime = 'nodejs';

// GET: Fetch list of available doctors
export async function GET(request: NextRequest) {
    try {
        const session = await getServerSession(authOptions);

        if (!session?.user?.id) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        await connectToDatabase();

        const searchParams = request.nextUrl.searchParams;
        const specialty = searchParams.get('specialty');
        const search = searchParams.get('search');

        // Build query for providers
        interface DoctorQuery {
            role: string;
            'profile.specialty'?: { $regex: string; $options: string };
            $or?: Array<{
                name?: { $regex: string; $options: string };
                'profile.specialty'?: { $regex: string; $options: string };
            }>;
        }
        
        const query: DoctorQuery = { role: 'provider' };

        if (specialty) {
            query['profile.specialty'] = { $regex: specialty, $options: 'i' };
        }

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { 'profile.specialty': { $regex: search, $options: 'i' } },
            ];
        }

        const doctors = await User.find(query)
            .select('name email profile.specialty profile.yearsExperience profile.bio profile.averageRating')
            .sort({ 'profile.averageRating': -1 })
            .limit(50)
            .lean();

        const formattedDoctors = doctors.map(doctor => ({
            _id: doctor._id,
            name: doctor.name,
            email: doctor.email,
            specialty: doctor.profile?.specialty || 'General Practice',
            yearsExperience: doctor.profile?.yearsExperience || 0,
            bio: doctor.profile?.bio || '',
            rating: doctor.profile?.averageRating || 0,
        }));

        return NextResponse.json(formattedDoctors);
    } catch (error) {
        console.error('Error fetching doctors:', error);
        return NextResponse.json({ error: 'Failed to fetch doctors' }, { status: 500 });
    }
}
