import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import ConsultationModel from '@/models/Consultation';
import UserModel from '@/models/User';
import SymptomCheckModel from '@/models/SymptomCheck';

// Get admin stats and overview data
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is an admin
        if (session.user.role !== 'admin') {
            return NextResponse.json({ error: 'Forbidden: Admin access only' }, { status: 403 });
        }

        await connectToDatabase();

        // Get user statistics
        const totalUsers = await UserModel.countDocuments();
        const patientCount = await UserModel.countDocuments({ role: 'patient' });
        const providerCount = await UserModel.countDocuments({ role: 'provider' });
        const adminCount = await UserModel.countDocuments({ role: 'admin' });

        // Get consultation statistics
        const totalConsultations = await ConsultationModel.countDocuments();
        const completedConsultations = await ConsultationModel.countDocuments({ status: 'completed' });
        const scheduledConsultations = await ConsultationModel.countDocuments({ status: 'scheduled' });
        const cancelledConsultations = await ConsultationModel.countDocuments({ status: 'cancelled' });

        // Get symptom check statistics
        const totalSymptomChecks = await SymptomCheckModel.countDocuments();

        // Get recent users
        const recentUsers = await UserModel.find()
            .sort({ createdAt: -1 })
            .limit(10)
            .select('name email role createdAt');

        // Get recent consultations
        const recentConsultations = await ConsultationModel.find()
            .sort({ scheduledFor: -1 })
            .limit(10)
            .populate('patientId', 'name email')
            .populate('providerId', 'name email');

        // Calculate basic metrics
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const todayUsers = await UserModel.countDocuments({
            createdAt: { $gte: today }
        });

        const todayConsultations = await ConsultationModel.countDocuments({
            scheduledFor: { $gte: today }
        });

        // Return the statistics
        return NextResponse.json({
            userStats: {
                total: totalUsers,
                patients: patientCount,
                providers: providerCount,
                admins: adminCount,
                newToday: todayUsers
            },
            consultationStats: {
                total: totalConsultations,
                completed: completedConsultations,
                scheduled: scheduledConsultations,
                cancelled: cancelledConsultations,
                scheduledToday: todayConsultations
            },
            symptomCheckStats: {
                total: totalSymptomChecks
            },
            recentUsers,
            recentConsultations
        });
    } catch (error) {
        console.error('Error fetching admin data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch admin dashboard data' },
            { status: 500 }
        );
    }
}
