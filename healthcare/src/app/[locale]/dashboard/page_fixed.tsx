'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { redirect } from 'next/navigation';
import { Link } from '@/navigation';
import { Activity, Calendar, FileText, Users, Heart, TrendingUp, X, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';

// Define types for activities
interface UserActivity {
    _id: string;
    type: 'symptom_check' | 'consultation' | 'prescription' | 'report' | 'emergency';
    title: string;
    description: string;
    date: string | Date;
    status: 'completed' | 'pending' | 'active' | 'cancelled';
    referenceId?: string;
    referenceModel?: string;
}

interface FormattedActivity {
    id: string | number;
    type: string;
    title: string;
    description: string;
    date: string;
    status: string;
}

interface HealthRecord {
    _id: string;
    title: string;
    type: string;
    date: string | Date;
    description: string;
    attachmentUrl?: string;
}

// Helper function to format dates as relative time (e.g., "2 hours ago")
function formatRelativeTime(date: Date): string {
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
        return 'Just now';
    }

    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) {
        return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    }

    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) {
        return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    }

    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays === 1) {
        return 'Yesterday';
    }

    if (diffInDays < 7) {
        return `${diffInDays} days ago`;
    }

    // For older dates, return the formatted date
    return date.toLocaleDateString();
}

export default function DashboardPage() {
    const { data: session, status } = useSession();
    const t = useTranslations('Dashboard');
    const tHealth = useTranslations('HealthRecords');
    const { error: showError } = useToast();
    const [showMedicalRecords, setShowMedicalRecords] = useState(false);
    const [showEmergencyContacts, setShowEmergencyContacts] = useState(false);
    const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
    const [isLoadingRecords, setIsLoadingRecords] = useState(false);

    const [recentActivities, setRecentActivities] = useState<FormattedActivity[]>([
        {
            id: 1,
            type: 'symptom_check',
            title: 'Symptom Check Completed',
            description: 'Headache and fever assessment',
            date: '2 hours ago',
            status: 'completed',
        },
        {
            id: 2,
            type: 'consultation',
            title: 'Video Consultation',
            description: 'Dr. Sarah Johnson - Follow-up',
            date: 'Yesterday',
            status: 'completed',
        },
        {
            id: 3,
            type: 'prescription',
            title: 'Prescription Updated',
            description: 'Pain medication dosage adjusted',
            date: '3 days ago',
            status: 'active',
        },
    ]);

    // Fetch user's recent activities
    useEffect(() => {
        if (session?.user?.id) {
            const fetchUserActivities = async () => {
                try {
                    const response = await fetch('/api/user/activities');

                    if (response.ok) {
                        const data = await response.json();
                        if (data.activities && data.activities.length > 0) {
                            setRecentActivities(data.activities.map((activity: UserActivity) => ({
                                id: activity._id,
                                type: activity.type,
                                title: activity.title,
                                description: activity.description,
                                date: formatRelativeTime(new Date(activity.date)),
                                status: activity.status
                            })));
                        }
                    }
                } catch (error) {
                    console.error('Error fetching recent activities:', error);
                }
            };

            fetchUserActivities();
        }
    }, [session]);

    // Fetch health records when the modal is opened
    useEffect(() => {
        if (showMedicalRecords && session?.user?.id) {
            const fetchHealthRecords = async () => {
                setIsLoadingRecords(true);
                try {
                    const response = await fetch('/api/health-records?limit=5');
                    if (!response.ok) throw new Error('Failed to fetch records');

                    const data = await response.json();
                    setHealthRecords(data.records);
                } catch (error) {
                    console.error('Error fetching health records:', error);
                    showError(tHealth('fetchError'));
                } finally {
                    setIsLoadingRecords(false);
                }
            };

            fetchHealthRecords();
        }
    }, [showMedicalRecords, session, tHealth, showError]);

    if (status === 'loading') {
        return (
            <div className="flex justify-center items-center min-h-screen">
                <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-500"></div>
            </div>
        );
    }

    if (!session) {
        redirect('/auth/signin');
    }

    const stats = [
        {
            title: t('stats.healthChecks'),
            value: '12',
            icon: Activity,
            description: t('stats.completedThisMonth'),
            trend: '+2 from last month',
        },
        {
            title: t('stats.consultations'),
            value: '3',
            icon: Calendar,
            description: t('stats.scheduledAppointments'),
            trend: 'Next: Tomorrow 2:00 PM',
        },
        {
            title: t('stats.healthScore'),
            value: '85%',
            icon: Heart,
            description: t('stats.basedOnAssessments'),
            trend: '+5% improvement',
        },
        {
            title: t('stats.reports'),
            value: '8',
            icon: FileText,
            description: t('stats.medicalDocuments'),
            trend: '2 new this week',
        },
    ];

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800 py-8 pt-24">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                        {t('welcomeBack', { name: session.user?.name || 'User' })}
                    </h1>
                    <p className="text-lg text-gray-600 dark:text-gray-300 mt-2">
                        {t('healthOverview')}
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    {stats.map((stat, index) => (
                        <Card key={index} glass animated className="overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="text-sm font-medium flex items-center">
                                    <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-1.5 mr-2">
                                        <stat.icon className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                    </div>
                                    {stat.title}
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                                    {stat.value}
                                </div>
                                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                    {stat.description}
                                </p>
                                <div className="flex items-center mt-2 text-xs">
                                    <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                                    <span className="text-green-500">{stat.trend}</span>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Quick Actions */}
                    <Card glass className="border-0 shadow-lg h-full">
                        <CardHeader>
                            <CardTitle className="flex items-center text-xl">
                                <div className="rounded-full bg-purple-100 dark:bg-purple-900/30 p-1.5 mr-2">
                                    <Activity className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                </div>
                                {t('quickActions')}
                            </CardTitle>
                            <CardDescription>
                                {t('quickActionsDesc')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <Link href="/symptom-checker">
                                <Button className="w-full justify-start" variant="gradient" animated>
                                    <Activity className="mr-2 h-4 w-4" />
                                    {t('startSymptomCheck')}
                                </Button>
                            </Link>
                            <Link href="/consultations">
                                <Button className="w-full justify-start" variant="gradient" animated>
                                    <Calendar className="mr-2 h-4 w-4" />
                                    {t('bookConsultation')}
                                </Button>
                            </Link>
                            <Button
                                className="w-full justify-start"
                                variant="outline"
                                animated
                                onClick={() => setShowMedicalRecords(true)}
                            >
                                <FileText className="mr-2 h-4 w-4" />
                                {t('viewMedicalRecords')}
                            </Button>
                            <Link href="/health-records">
                                <Button className="w-full justify-start" variant="outline" animated>
                                    <FileText className="mr-2 h-4 w-4" />
                                    {t('healthRecords')}
                                </Button>
                            </Link>
                            <Button
                                className="w-full justify-start"
                                variant="outline"
                                animated
                                onClick={() => setShowEmergencyContacts(true)}
                            >
                                <Users className="mr-2 h-4 w-4" />
                                {t('emergencyContacts')}
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Recent Activities */}
                    <Card glass className="border-0 shadow-lg h-full overflow-hidden">
                        <CardHeader>
                            <CardTitle className="flex items-center text-xl">
                                <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-1.5 mr-2">
                                    <Activity className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                </div>
                                {t('recentActivities')}
                            </CardTitle>
                            <CardDescription>
                                {t('recentActivitiesDesc')}
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {recentActivities.map((activity) => (
                                    <div key={activity.id} className="flex items-start space-x-4 p-3 rounded-lg bg-white/10 dark:bg-white/5 backdrop-blur-sm border border-white/10">
                                        <div className="flex-shrink-0">
                                            <div className="w-2 h-2 bg-blue-600 rounded-full mt-2"></div>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium">
                                                {activity.title}
                                            </p>
                                            <p className="text-sm text-gray-600 dark:text-gray-300">
                                                {activity.description}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                                                {activity.date}
                                            </p>
                                        </div>
                                        <div className="flex-shrink-0">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${activity.status === 'completed'
                                                    ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                                                    : 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300'
                                                }`}>
                                                {activity.status}
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Medical Records Modal */}
                {showMedicalRecords && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-xl shadow-lg border border-white/20 dark:border-gray-700/30 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
                            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700/50">
                                <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{t('viewMedicalRecords')}</h2>
                                <Button variant="ghost" size="icon" onClick={() => setShowMedicalRecords(false)} animated>
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                            <div className="p-6">
                                {isLoadingRecords ? (
                                    <div className="flex justify-center items-center h-40">
                                        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-500"></div>
                                    </div>
                                ) : healthRecords.length > 0 ? (
                                    <div className="space-y-4">
                                        <div>
                                            <h3 className="font-medium text-lg mb-2">{tHealth('title')}</h3>
                                            <div className="space-y-2">
                                                {healthRecords.map((record) => (
                                                    <Card key={record._id} glass className="p-3 border-0">
                                                        <div className="flex justify-between items-center">
                                                            <div>
                                                                <p className="font-medium">{record.title}</p>
                                                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                                                    {tHealth(`recordType.${record.type}`)} • {new Date(record.date).toLocaleDateString()}
                                                                </p>
                                                                <p className="text-sm text-gray-700 dark:text-gray-300 mt-1 line-clamp-1">{record.description}</p>
                                                            </div>
                                                            <div className="flex space-x-2">
                                                                {record.attachmentUrl && (
                                                                    <Button
                                                                        size="sm"
                                                                        variant="outline"
                                                                        onClick={() => window.open(record.attachmentUrl, '_blank')}
                                                                        title={tHealth('viewAttachment')}
                                                                        animated
                                                                    >
                                                                        <ExternalLink className="h-4 w-4" />
                                                                    </Button>
                                                                )}
                                                                <Link href={`/health-records?edit=${record._id}`}>
                                                                    <Button size="sm" variant="outline" animated>{tHealth('edit')}</Button>
                                                                </Link>
                                                            </div>
                                                        </div>
                                                    </Card>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="text-center py-8">
                                        <div className="text-5xl mb-4">📋</div>
                                        <h3 className="text-xl font-semibold mb-2 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">{tHealth('noRecords')}</h3>
                                        <p className="text-gray-500 dark:text-gray-400 mb-6">{tHealth('createFirstRecord')}</p>
                                        <Link href="/health-records">
                                            <Button variant="gradient" animated>
                                                <FileText className="h-4 w-4 mr-2" />
                                                {tHealth('addRecord')}
                                            </Button>
                                        </Link>
                                    </div>
                                )}
                            </div>
                            <div className="border-t border-gray-200 dark:border-gray-700/50 p-4 flex justify-between">
                                <Link href="/health-records">
                                    <Button variant="outline" animated>
                                        {tHealth('viewAllRecords')}
                                    </Button>
                                </Link>
                                <Button variant="outline" onClick={() => setShowMedicalRecords(false)}>
                                    {t('close')}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Emergency Contacts Modal */}
                {showEmergencyContacts && (
                    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-xl shadow-lg border border-white/20 dark:border-gray-700/30 max-w-md w-full">
                            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700/50">
                                <h2 className="text-xl font-semibold text-transparent bg-clip-text bg-gradient-to-r from-red-600 to-pink-600">{t('emergencyContacts')}</h2>
                                <Button variant="ghost" size="icon" onClick={() => setShowEmergencyContacts(false)} animated>
                                    <X className="h-5 w-5" />
                                </Button>
                            </div>
                            <div className="p-6 space-y-4">
                                <div className="text-center mb-4">
                                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-pink-600 mb-3 shadow-lg">
                                        <Users className="h-8 w-8 text-white" />
                                    </div>
                                    <h3 className="text-lg font-medium">{t('emergencyContactsTitle')}</h3>
                                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{t('emergencyContactsDesc')}</p>
                                </div>

                                <div className="space-y-3">
                                    {[
                                        { name: 'Emergency Services', number: '911', relation: 'Emergency' },
                                        { name: 'Dr. Sarah Johnson', number: '(555) 123-4567', relation: 'Primary Doctor' },
                                        { name: 'John Smith', number: '(555) 987-6543', relation: 'Spouse' }
                                    ].map((contact, index) => (
                                        <div
                                            key={index}
                                            className="p-3 border border-white/10 dark:border-white/5 rounded-lg bg-white/30 dark:bg-white/5 backdrop-blur-sm shadow-sm"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-medium">{contact.name}</h4>
                                                    <p className="text-sm text-gray-500 dark:text-gray-400">{contact.relation}</p>
                                                    <p className="text-sm font-medium text-blue-600 dark:text-blue-400 mt-1">{contact.number}</p>
                                                </div>
                                                <Button variant="outline" size="sm" className="rounded-full h-8 w-8 p-0" animated>
                                                    <Users className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="pt-4 flex justify-between border-t border-gray-200 dark:border-gray-700/50 mt-4">
                                    <Button variant="gradient" className="w-full mr-2" animated>
                                        {t('addNewContact')}
                                    </Button>
                                    <Button variant="outline" onClick={() => setShowEmergencyContacts(false)}>
                                        {t('close')}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
