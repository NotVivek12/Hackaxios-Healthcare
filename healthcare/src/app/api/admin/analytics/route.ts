import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectToDatabase from '@/lib/mongodb';
import SymptomCheckModel from '@/models/SymptomCheck';
import UserModel from '@/models/User';

/**
 * Get health analytics data for admin dashboard
 * This endpoint provides aggregated data for:
 * - Symptom trends over time
 * - Geographic distribution of symptoms/conditions
 * - Urgency levels and risk distribution
 * - Potential outbreak detection based on similar symptoms in an area
 */
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

        // Get date ranges for different time periods
        const today = new Date();
        const oneWeekAgo = new Date(today);
        oneWeekAgo.setDate(today.getDate() - 7);

        const oneMonthAgo = new Date(today);
        oneMonthAgo.setMonth(today.getMonth() - 1);

        const threeMonthsAgo = new Date(today);
        threeMonthsAgo.setMonth(today.getMonth() - 3);

        // Get symptom trend data (daily counts for past week, weekly for past month)
        const symptomChecksDaily = await getSymptomChecksByTimeframe(oneWeekAgo, 'daily');
        const symptomChecksWeekly = await getSymptomChecksByTimeframe(oneMonthAgo, 'weekly');
        const symptomChecksMonthly = await getSymptomChecksByTimeframe(threeMonthsAgo, 'monthly');

        // Get distribution of urgency levels
        const urgencyDistribution = await SymptomCheckModel.aggregate([
            {
                $group: {
                    _id: '$aiAnalysis.urgency',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { '_id': 1 }
            }
        ]);

        // Get distribution of risk levels
        const riskDistribution = await SymptomCheckModel.aggregate([
            {
                $group: {
                    _id: '$aiAnalysis.riskLevel',
                    count: { $sum: 1 }
                }
            },
            {
                $sort: { '_id': 1 }
            }
        ]);

        // Get top symptoms reported in the past month
        const topSymptoms = await SymptomCheckModel.aggregate([
            {
                $match: {
                    createdAt: { $gte: oneMonthAgo }
                }
            },
            {
                $unwind: '$symptoms'
            },
            {
                $group: {
                    _id: '$symptoms.name',
                    count: { $sum: 1 },
                    severityDistribution: {
                        $push: '$symptoms.severity'
                    }
                }
            },
            {
                $addFields: {
                    mildCount: {
                        $size: {
                            $filter: {
                                input: '$severityDistribution',
                                as: 'severity',
                                cond: { $eq: ['$$severity', 'mild'] }
                            }
                        }
                    },
                    moderateCount: {
                        $size: {
                            $filter: {
                                input: '$severityDistribution',
                                as: 'severity',
                                cond: { $eq: ['$$severity', 'moderate'] }
                            }
                        }
                    },
                    severeCount: {
                        $size: {
                            $filter: {
                                input: '$severityDistribution',
                                as: 'severity',
                                cond: { $eq: ['$$severity', 'severe'] }
                            }
                        }
                    }
                }
            },
            {
                $project: {
                    symptom: '$_id',
                    count: 1,
                    mildCount: 1,
                    moderateCount: 1,
                    severeCount: 1,
                    severityDistribution: 0
                }
            },
            {
                $sort: { count: -1 }
            },
            {
                $limit: 10
            }
        ]);

        // Get top possible conditions diagnosed
        const topConditions = await SymptomCheckModel.aggregate([
            {
                $match: {
                    createdAt: { $gte: oneMonthAgo }
                }
            },
            {
                $unwind: '$aiAnalysis.possibleConditions'
            },
            {
                $group: {
                    _id: '$aiAnalysis.possibleConditions.condition',
                    count: { $sum: 1 },
                    avgProbability: { $avg: '$aiAnalysis.possibleConditions.probability' }
                }
            },
            {
                $sort: { count: -1 }
            },
            {
                $limit: 10
            }
        ]);

        // Get potential outbreak indicators - rapid increase in similar symptoms
        const potentialOutbreaks = await detectPotentialOutbreaks();

        // Get user activity metrics
        const userGrowth = await getUserGrowthMetrics();

        // Return the analytics data
        return NextResponse.json({
            symptomTrends: {
                daily: symptomChecksDaily,
                weekly: symptomChecksWeekly,
                monthly: symptomChecksMonthly
            },
            distributions: {
                urgency: urgencyDistribution,
                risk: riskDistribution
            },
            topInsights: {
                symptoms: topSymptoms,
                conditions: topConditions
            },
            outbreakIndicators: potentialOutbreaks,
            userMetrics: userGrowth
        });
    } catch (error) {
        console.error('Error fetching health analytics data:', error);
        return NextResponse.json(
            { error: 'Failed to fetch health analytics data' },
            { status: 500 }
        );
    }
}

/**
 * Helper function to get symptom checks aggregated by timeframe
 */
async function getSymptomChecksByTimeframe(startDate: Date, timeframe: 'daily' | 'weekly' | 'monthly') {
    const groupByFormat = {
        daily: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
        },
        weekly: {
            $dateToString: { format: '%Y-W%U', date: '$createdAt' }
        },
        monthly: {
            $dateToString: { format: '%Y-%m', date: '$createdAt' }
        }
    };

    return await SymptomCheckModel.aggregate([
        {
            $match: {
                createdAt: { $gte: startDate }
            }
        },
        {
            $group: {
                _id: groupByFormat[timeframe],
                count: { $sum: 1 },
                emergencyCount: {
                    $sum: {
                        $cond: [{ $eq: ['$aiAnalysis.urgency', 'emergency'] }, 1, 0]
                    }
                },
                criticalCount: {
                    $sum: {
                        $cond: [{ $eq: ['$aiAnalysis.riskLevel', 'critical'] }, 1, 0]
                    }
                }
            }
        },
        {
            $sort: { '_id': 1 }
        }
    ]);
}

/**
 * Detect potential disease outbreaks based on sudden increases
 * in similar symptoms or conditions within a short timeframe
 */
async function detectPotentialOutbreaks() {
    const today = new Date();
    const threeDaysAgo = new Date(today);
    threeDaysAgo.setDate(today.getDate() - 3);

    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(today.getDate() - 7);

    // Get recent symptoms with significant increase
    const recentSymptoms = await SymptomCheckModel.aggregate([
        {
            $match: {
                createdAt: { $gte: oneWeekAgo }
            }
        },
        {
            $unwind: '$symptoms'
        },
        {
            $group: {
                _id: '$symptoms.name',
                totalCount: { $sum: 1 },
                recentCount: {
                    $sum: {
                        $cond: [
                            { $gte: ['$createdAt', threeDaysAgo] },
                            1,
                            0
                        ]
                    }
                },
                previousCount: {
                    $sum: {
                        $cond: [
                            {
                                $and: [
                                    { $gte: ['$createdAt', oneWeekAgo] },
                                    { $lt: ['$createdAt', threeDaysAgo] }
                                ]
                            },
                            1,
                            0
                        ]
                    }
                }
            }
        },
        {
            $addFields: {
                growthRate: {
                    $cond: [
                        { $eq: ['$previousCount', 0] },
                        '$recentCount', // If previous count is 0, just return recent count
                        { $divide: ['$recentCount', '$previousCount'] }
                    ]
                }
            }
        },
        {
            $match: {
                recentCount: { $gte: 5 }, // Only consider symptoms with at least 5 recent occurrences
                growthRate: { $gt: 1.5 }  // 50% increase or more
            }
        },
        {
            $sort: { growthRate: -1 }
        },
        {
            $limit: 5
        }
    ]);

    // Get recent conditions with significant increase
    const recentConditions = await SymptomCheckModel.aggregate([
        {
            $match: {
                createdAt: { $gte: oneWeekAgo }
            }
        },
        {
            $unwind: '$aiAnalysis.possibleConditions'
        },
        {
            $group: {
                _id: '$aiAnalysis.possibleConditions.condition',
                totalCount: { $sum: 1 },
                recentCount: {
                    $sum: {
                        $cond: [
                            { $gte: ['$createdAt', threeDaysAgo] },
                            1,
                            0
                        ]
                    }
                },
                previousCount: {
                    $sum: {
                        $cond: [
                            {
                                $and: [
                                    { $gte: ['$createdAt', oneWeekAgo] },
                                    { $lt: ['$createdAt', threeDaysAgo] }
                                ]
                            },
                            1,
                            0
                        ]
                    }
                }
            }
        },
        {
            $addFields: {
                growthRate: {
                    $cond: [
                        { $eq: ['$previousCount', 0] },
                        '$recentCount',
                        { $divide: ['$recentCount', '$previousCount'] }
                    ]
                }
            }
        },
        {
            $match: {
                recentCount: { $gte: 3 },  // Only consider conditions with at least 3 recent occurrences
                growthRate: { $gt: 1.5 }   // 50% increase or more
            }
        },
        {
            $sort: { growthRate: -1 }
        },
        {
            $limit: 5
        }
    ]);

    return {
        symptoms: recentSymptoms,
        conditions: recentConditions
    };
}

/**
 * Get user growth metrics over time
 */
async function getUserGrowthMetrics() {
    const today = new Date();
    const oneMonthAgo = new Date(today);
    oneMonthAgo.setMonth(today.getMonth() - 1);

    return await UserModel.aggregate([
        {
            $match: {
                createdAt: { $gte: oneMonthAgo }
            }
        },
        {
            $group: {
                _id: {
                    $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
                },
                count: { $sum: 1 }
            }
        },
        {
            $sort: { '_id': 1 }
        }
    ]);
}
