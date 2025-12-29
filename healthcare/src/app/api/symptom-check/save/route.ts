import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import SymptomCheckModel from '@/models/SymptomCheck';
import UserModel from '@/models/User';

/**
 * Save symptom check results and track recent activity
 * POST /api/symptom-check/save
 */
export async function POST(req: Request) {
    try {
        // Get the authenticated user
        const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.id) {
            return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
        }

        // Parse request body
        const body = await req.json();
        const { symptoms, analysis } = body;

    if (!Array.isArray(symptoms) || !analysis || typeof analysis !== 'object') {
            return NextResponse.json(
        { error: 'Symptoms and analysis data are required' },
                { status: 400 }
            );
        }

        // Connect to database
        await connectToDatabase();

        // Save symptom check
        const symptomCheck = await SymptomCheckModel.create({
            userId: session.user.id,
            symptoms,
            aiAnalysis: analysis,
            status: 'completed',
        });

        // Update user's recent activities
        await UserModel.findByIdAndUpdate(
            session.user.id,
            {
                $push: {
                    recentActivities: {
                        $each: [{
                            type: 'symptom_check',
                            title: 'Symptom Check Completed',
                            description: symptoms.map((s: { name: string }) => s.name).join(', '),
                            date: new Date(),
                            status: 'completed',
                            referenceId: symptomCheck._id
                        }],
                        $position: 0, // Add to the beginning of the array
                        $slice: 10 // Keep only the 10 most recent activities
                    }
                }
            }
        );

        return NextResponse.json(
            { success: true, message: 'Symptom check saved', id: symptomCheck._id },
            { status: 200 }
        );
    } catch (error) {
        console.error('Error saving symptom check:', error);
        return NextResponse.json(
            { error: 'Failed to save symptom check' },
            { status: 500 }
        );
    }
}

// Ensure Node.js runtime to make getServerSession work reliably
export const runtime = 'nodejs';
