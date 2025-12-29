import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import ConsultationModel from '@/models/Consultation';
import UserModel from '@/models/User';

// Get provider stats and upcoming consultations
export async function GET() {
    try {
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Check if user is a provider
        if (session.user.role !== 'provider') {
            return NextResponse.json({ error: 'Forbidden: Provider access only' }, { status: 403 });
        }

        await connectToDatabase();

        // Current date
        const now = new Date();

        // Get upcoming consultations for this provider
        const upcomingConsultations = await ConsultationModel.find({
            providerId: session.user.id,
            scheduledFor: { $gte: now },
            status: { $nin: ['cancelled', 'completed'] }
        })
            .sort({ scheduledFor: 1 })
            .populate('patientId', 'name email')
            .limit(10);

        // Get total consultation count
        const totalConsultations = await ConsultationModel.countDocuments({
            providerId: session.user.id
        });

        // Get completed consultation count
        const completedConsultations = await ConsultationModel.countDocuments({
            providerId: session.user.id,
            status: 'completed'
        });

        // Get unique patient count
        const uniquePatients = await ConsultationModel.distinct('patientId', {
            providerId: session.user.id
        });

        // Get today's consultations
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayConsultations = await ConsultationModel.countDocuments({
            providerId: session.user.id,
            scheduledFor: {
                $gte: today,
                $lt: tomorrow
            }
        });

        // Get recent patients
        const recentPatientIds = await ConsultationModel.find({
            providerId: session.user.id
        })
            .sort({ scheduledFor: -1 })
            .limit(20)
            .distinct('patientId');

        const recentPatients = await UserModel.find({
            _id: { $in: recentPatientIds },
            role: 'patient'
        })
            .select('name email profilePicture lastLogin')
            .limit(10);

        return NextResponse.json({
            stats: {
                totalConsultations,
                completedConsultations,
                uniquePatientCount: uniquePatients.length,
                todayConsultations
            },
            upcomingConsultations,
            recentPatients
        });
    } catch (error) {
        console.error('Error fetching provider data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch provider data' },
            { status: 500 }
        );
    }
}
