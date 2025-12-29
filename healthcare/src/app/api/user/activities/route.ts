import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import UserModel from '@/models/User';

/**
 * Define the interface for our lean user document
 */
interface UserWithActivities {
    _id: string;
    recentActivities?: Array<{
        type: string;
        title: string;
        description: string;
        date: Date;
        status: string;
        referenceId?: string;
        referenceModel?: string;
    }>;
}

/**
 * Get user's recent activities
 * GET /api/user/activities
 */
export async function GET() {
    try {
        // Get the authenticated user
        const session = await getServerSession(authOptions);
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        // Connect to database
        await connectToDatabase();

        // Get user with recent activities
        const user = await UserModel.findById(session.user.id)
            .select('recentActivities')
            .lean<UserWithActivities>();

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        // TypeScript can't infer that recentActivities exists in the lean() result
        // so we need to cast or handle it safely
        const activities = user.recentActivities || [];

        return NextResponse.json({ activities });
    } catch (error) {
        console.error('Error fetching user activities:', error);
        return NextResponse.json(
            { error: 'Failed to fetch activities' },
            { status: 500 }
        );
    }
}
