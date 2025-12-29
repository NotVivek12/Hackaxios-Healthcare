'use client';

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
    Activity,
    AlertTriangle,
    TrendingUp,
    BarChart3,
    Calendar,
    ThermometerSnowflake
} from 'lucide-react';

// Chart components would be imported from a library like Chart.js or Recharts
// For this implementation, we'll create placeholders

interface AnalyticsData {
    symptomTrends: {
        daily: Array<{
            _id: string;
            count: number;
            emergencyCount: number;
            criticalCount: number;
        }>;
        weekly: Array<{
            _id: string;
            count: number;
            emergencyCount: number;
            criticalCount: number;
        }>;
        monthly: Array<{
            _id: string;
            count: number;
            emergencyCount: number;
            criticalCount: number;
        }>;
    };
    distributions: {
        urgency: Array<{
            _id: string;
            count: number;
        }>;
        risk: Array<{
            _id: string;
            count: number;
        }>;
    };
    topInsights: {
        symptoms: Array<{
            symptom: string;
            count: number;
            mildCount: number;
            moderateCount: number;
            severeCount: number;
        }>;
        conditions: Array<{
            _id: string;
            count: number;
            avgProbability: number;
        }>;
    };
    outbreakIndicators: {
        symptoms: Array<{
            _id: string;
            totalCount: number;
            recentCount: number;
            previousCount: number;
            growthRate: number;
        }>;
        conditions: Array<{
            _id: string;
            totalCount: number;
            recentCount: number;
            previousCount: number;
            growthRate: number;
        }>;
    };
    userMetrics: Array<{
        _id: string;
        count: number;
    }>;
}

export default function HealthAnalyticsDashboard() {
    const t = useTranslations('HealthAnalytics');
    const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
    const [timeframe, setTimeframe] = useState<'daily' | 'weekly' | 'monthly'>('weekly');
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Fetch analytics data
    useEffect(() => {
        const fetchAnalyticsData = async () => {
            setIsLoading(true);
            setError(null);

            try {
                const response = await fetch('/api/admin/analytics');

                if (!response.ok) {
                    throw new Error(`Error fetching analytics data: ${response.status}`);
                }

                const data = await response.json();
                setAnalyticsData(data);
            } catch (err) {
                console.error('Failed to fetch analytics data:', err);
                setError('Failed to load analytics data. Please try again later.');
            } finally {
                setIsLoading(false);
            }
        };

        fetchAnalyticsData();
    }, []);

    // Loading state
    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" role="status">
                        <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">Loading...</span>
                    </div>
                    <p className="mt-2 text-gray-600">{t('loading')}</p>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-md flex items-start">
                <AlertTriangle className="h-5 w-5 mr-2 mt-0.5 flex-shrink-0" />
                <div>
                    <p className="font-medium">{t('errorLoading')}</p>
                    <p className="text-sm">{error}</p>
                    <Button
                        onClick={() => window.location.reload()}
                        variant="outline"
                        className="mt-2 text-red-800 border-red-300 hover:bg-red-100"
                    >
                        {t('tryAgain')}
                    </Button>
                </div>
            </div>
        );
    }

    // No data state
    if (!analyticsData) {
        return (
            <div className="bg-blue-50 border border-blue-200 text-blue-800 px-4 py-3 rounded-md">
                <p className="font-medium">{t('noData')}</p>
                <p className="text-sm">{t('noDataDescription')}</p>
            </div>
        );
    }

    // Determine if there are any potential outbreaks to display
    const hasOutbreaks =
        (analyticsData.outbreakIndicators.symptoms && analyticsData.outbreakIndicators.symptoms.length > 0) ||
        (analyticsData.outbreakIndicators.conditions && analyticsData.outbreakIndicators.conditions.length > 0);

    return (
        <div>
            <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">{t('healthTrends')}</h2>
                <p className="text-gray-600 mb-4">{t('healthTrendsDescription')}</p>

                {/* Time Range Selector */}
                <div className="flex space-x-2 mb-6">
                    <Button
                        variant={timeframe === 'daily' ? 'default' : 'outline'}
                        onClick={() => setTimeframe('daily')}
                        className="flex items-center"
                    >
                        <Calendar className="h-4 w-4 mr-1" />
                        {t('daily')}
                    </Button>
                    <Button
                        variant={timeframe === 'weekly' ? 'default' : 'outline'}
                        onClick={() => setTimeframe('weekly')}
                        className="flex items-center"
                    >
                        <Calendar className="h-4 w-4 mr-1" />
                        {t('weekly')}
                    </Button>
                    <Button
                        variant={timeframe === 'monthly' ? 'default' : 'outline'}
                        onClick={() => setTimeframe('monthly')}
                        className="flex items-center"
                    >
                        <Calendar className="h-4 w-4 mr-1" />
                        {t('monthly')}
                    </Button>
                </div>

                {/* Trend Chart Placeholder */}
                <div className="bg-white p-4 rounded-lg border border-gray-200 mb-6">
                    <h3 className="text-lg font-medium mb-2">{t('symptomTrends')}</h3>
                    <div className="h-64 bg-gray-50 border border-gray-200 rounded flex items-center justify-center">
                        <div className="text-center">
                            <BarChart3 className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                            <p className="text-gray-500">{t('chartPlaceholder')}</p>
                        </div>
                    </div>
                    <div className="grid grid-cols-3 gap-4 mt-4">
                        {analyticsData.symptomTrends[timeframe].slice(-3).map((dataPoint, index) => (
                            <div key={index} className="bg-gray-50 p-3 rounded border border-gray-200">
                                <p className="text-sm text-gray-600">{dataPoint._id}</p>
                                <p className="text-lg font-bold">{dataPoint.count} {t('reports')}</p>
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                    <span>{dataPoint.emergencyCount} {t('emergencyCount')}</span>
                                    <span>{dataPoint.criticalCount} {t('criticalCount')}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Potential Outbreak Alerts */}
            {hasOutbreaks && (
                <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-2 flex items-center">
                        <AlertTriangle className="h-5 w-5 text-red-600 mr-2" />
                        {t('potentialOutbreaks')}
                    </h2>
                    <p className="text-gray-600 mb-4">{t('outbreakDescription')}</p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {analyticsData.outbreakIndicators.symptoms.length > 0 && (
                            <Card className="border-l-4 border-l-amber-500">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg flex items-center">
                                        <ThermometerSnowflake className="h-4 w-4 mr-2 text-amber-500" />
                                        {t('increasingSymptoms')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2">
                                        {analyticsData.outbreakIndicators.symptoms.map((symptom, index) => (
                                            <li key={index} className="flex justify-between items-center p-2 bg-amber-50 rounded">
                                                <span className="font-medium">{symptom._id}</span>
                                                <div className="flex items-center">
                                                    <TrendingUp className="h-4 w-4 text-amber-600 mr-1" />
                                                    <span className="text-amber-700">
                                                        {Math.round(symptom.growthRate * 100)}% {t('increase')}
                                                    </span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        )}

                        {analyticsData.outbreakIndicators.conditions.length > 0 && (
                            <Card className="border-l-4 border-l-red-500">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-lg flex items-center">
                                        <Activity className="h-4 w-4 mr-2 text-red-500" />
                                        {t('increasingConditions')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <ul className="space-y-2">
                                        {analyticsData.outbreakIndicators.conditions.map((condition, index) => (
                                            <li key={index} className="flex justify-between items-center p-2 bg-red-50 rounded">
                                                <span className="font-medium">{condition._id}</span>
                                                <div className="flex items-center">
                                                    <TrendingUp className="h-4 w-4 text-red-600 mr-1" />
                                                    <span className="text-red-700">
                                                        {Math.round(condition.growthRate * 100)}% {t('increase')}
                                                    </span>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </div>
            )}

            {/* Top Insights */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">{t('topInsights')}</h2>
                <p className="text-gray-600 mb-4">{t('insightsDescription')}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Top Symptoms */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('topSymptoms')}</CardTitle>
                            <CardDescription>{t('topSymptomsDescription')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {analyticsData.topInsights.symptoms.slice(0, 5).map((symptom, index) => (
                                    <div key={index} className="flex items-center justify-between p-2 border-b">
                                        <div>
                                            <span className="font-medium">{symptom.symptom}</span>
                                            <div className="text-xs text-gray-500 mt-1">
                                                <span className="inline-block w-16">{t('mild')}: {symptom.mildCount}</span>
                                                <span className="inline-block w-16">{t('moderate')}: {symptom.moderateCount}</span>
                                                <span className="inline-block w-16">{t('severe')}: {symptom.severeCount}</span>
                                            </div>
                                        </div>
                                        <span className="text-lg font-bold">{symptom.count}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Top Conditions */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('topConditions')}</CardTitle>
                            <CardDescription>{t('topConditionsDescription')}</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                                {analyticsData.topInsights.conditions.slice(0, 5).map((condition, index) => (
                                    <div key={index} className="flex items-center justify-between p-2 border-b">
                                        <span className="font-medium">{condition._id}</span>
                                        <div className="text-right">
                                            <span className="text-lg font-bold">{condition.count}</span>
                                            <div className="text-xs text-gray-500">
                                                {Math.round(condition.avgProbability)}% {t('probability')}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Risk & Urgency Distribution */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">{t('distributions')}</h2>
                <p className="text-gray-600 mb-4">{t('distributionsDescription')}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Risk Level Distribution */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('riskLevels')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-48 bg-gray-50 border border-gray-200 rounded flex items-center justify-center mb-4">
                                <div className="text-center">
                                    <BarChart3 className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                                    <p className="text-gray-500">{t('chartPlaceholder')}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-4 gap-2">
                                {analyticsData.distributions.risk.map((level, index) => (
                                    <div
                                        key={index}
                                        className={`p-2 rounded text-center ${level._id === 'low' ? 'bg-green-100 text-green-800' :
                                                level._id === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                                                    level._id === 'high' ? 'bg-orange-100 text-orange-800' :
                                                        'bg-red-100 text-red-800'
                                            }`}
                                    >
                                        <div className="text-xs uppercase">{level._id}</div>
                                        <div className="text-lg font-bold">{level.count}</div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    {/* Urgency Level Distribution */}
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('urgencyLevels')}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="h-48 bg-gray-50 border border-gray-200 rounded flex items-center justify-center mb-4">
                                <div className="text-center">
                                    <BarChart3 className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                                    <p className="text-gray-500">{t('chartPlaceholder')}</p>
                                </div>
                            </div>
                            <div className="grid grid-cols-3 gap-2">
                                {analyticsData.distributions.urgency.map((level, index) => (
                                    <div
                                        key={index}
                                        className={`p-2 rounded text-center ${level._id === 'routine' ? 'bg-blue-100 text-blue-800' :
                                                level._id === 'urgent' ? 'bg-amber-100 text-amber-800' :
                                                    'bg-red-100 text-red-800'
                                            }`}
                                    >
                                        <div className="text-xs uppercase">{level._id}</div>
                                        <div className="text-lg font-bold">{level.count}</div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* User Growth Metrics */}
            <div className="mb-6">
                <h2 className="text-2xl font-bold mb-2">{t('userGrowth')}</h2>
                <p className="text-gray-600 mb-4">{t('userGrowthDescription')}</p>

                <Card>
                    <CardHeader>
                        <CardTitle>{t('userSignups')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-48 bg-gray-50 border border-gray-200 rounded flex items-center justify-center mb-4">
                            <div className="text-center">
                                <BarChart3 className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                                <p className="text-gray-500">{t('chartPlaceholder')}</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2">
                            {analyticsData.userMetrics.slice(-6).map((day, index) => (
                                <div key={index} className="p-2 rounded text-center bg-blue-50 border border-blue-100">
                                    <div className="text-xs text-gray-600">{day._id}</div>
                                    <div className="text-lg font-bold text-blue-700">{day.count}</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Export Options */}
            <div className="flex justify-end space-x-2">
                <Button variant="outline">
                    {t('exportCSV')}
                </Button>
                <Button variant="outline">
                    {t('exportPDF')}
                </Button>
                <Button variant="default">
                    {t('shareReport')}
                </Button>
            </div>
        </div>
    );
}
