'use client';

import { useState, useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { redirect } from 'next/navigation';
import { Link } from '@/navigation';
import { Activity, Calendar, FileText, Users, Heart, TrendingUp, X, ExternalLink, MessageSquare, Bell, Stethoscope } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/toast';
import { motion, AnimatePresence } from 'framer-motion';
import gsap from 'gsap';
import {
    ScaleIn,
    FadeIn,
    FloatingElement,
    GlowingText,
    StaggerContainer
} from '@/components/animations/motion-effects';

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
    // Define HealthRecord type for health records
    interface HealthRecord {
        _id: string;
        title: string;
        type: string;
        date: string | Date;
        description: string;
        attachmentUrl?: string;
    }

    const [healthRecords, setHealthRecords] = useState<HealthRecord[]>([]);
    const [isLoadingRecords, setIsLoadingRecords] = useState(false);

    // Animation refs
    const statsRef = useRef(null);

    // Stats data
    const stats = [
        {
            title: t('stats.healthChecks'),
            value: '12',
            icon: Activity,
            description: t('stats.completedThisMonth'),
            trend: '+2 from last month',
            color: 'from-blue-500 to-indigo-600',
            bgColor: 'bg-blue-100 dark:bg-blue-900/20'
        },
        {
            title: t('stats.consultations'),
            value: '3',
            icon: Calendar,
            description: t('stats.scheduledAppointments'),
            trend: 'Next: Tomorrow 2:00 PM',
            color: 'from-emerald-500 to-teal-600',
            bgColor: 'bg-emerald-100 dark:bg-emerald-900/20'
        },
        {
            title: t('stats.healthScore'),
            value: '85%',
            icon: Heart,
            description: t('stats.basedOnAssessments'),
            trend: '+5% improvement',
            color: 'from-red-500 to-pink-600',
            bgColor: 'bg-red-100 dark:bg-red-900/20'
        },
        {
            title: t('stats.reports'),
            value: '8',
            icon: FileText,
            description: t('stats.medicalDocuments'),
            trend: '2 new this week',
            color: 'from-amber-500 to-orange-600',
            bgColor: 'bg-amber-100 dark:bg-amber-900/20'
        },
    ];

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

    // Animate stats with GSAP when they come into view
    useEffect(() => {
        if (statsRef.current) {
            const observer = new IntersectionObserver((entries) => {
                entries.forEach(entry => {
                    if (entry.isIntersecting) {
                        gsap.to('.stat-value', {
                            duration: 1.5,
                            stagger: 0.2,
                            opacity: 1,
                            y: 0,
                            ease: 'power3.out'
                        });
                        observer.unobserve(entry.target);
                    }
                });
            }, { threshold: 0.2 });

            observer.observe(statsRef.current);
            return () => observer.disconnect();
        }
    }, []);

    if (status === 'loading') {
        return (
            <div className="flex justify-center items-center min-h-screen">
                {/* Loading animations removed */}
            </div>
        );
    }

    if (!session) {
        redirect('/auth/signin');
    }
    return (
        <>
            <div className="min-h-screen bg-gradient-to-b from-gray-50/80 to-white/40 dark:from-gray-900/90 dark:to-black/80 backdrop-blur-sm py-8 pt-24">
                <AnimatePresence>
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <StaggerContainer className="mb-8">
                            <GlowingText className="text-3xl md:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-500">
                                Dashboard
                            </GlowingText>
                            <motion.p
                                className="text-lg text-gray-600 dark:text-gray-300 mt-2"
                                initial={{ opacity: 0, y: 5 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                {t('healthOverview')}
                            </motion.p>
                        </StaggerContainer>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8" ref={statsRef}>
                            {stats.map((stat, index) => (
                                <ScaleIn delay={0.1 * index} key={index}>
                                    <FloatingElement>
                                        <Card className="border-0 shadow-glow-sm h-full">
                                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                                <CardTitle className="text-sm font-medium flex items-center">
                                                    <div className={`rounded-full ${stat.bgColor} p-1.5 mr-2`}>
                                                        <stat.icon className="h-4 w-4" />
                                                    </div>
                                                    {stat.title}
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <div className="text-3xl font-bold stat-value bg-clip-text text-transparent bg-gradient-to-r opacity-0 -translate-y-2"
                                                    style={{ backgroundImage: `linear-gradient(to right, ${stat.color.split(' ')[1]}, ${stat.color.split(' ')[1]})` }}>
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
                                    </FloatingElement>
                                </ScaleIn>
                            ))}
                        </div>

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                            <FadeIn delay={0.2}>
                                <Card className="border-0 shadow-glow-sm h-full">
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
                                            <Button className="w-full justify-start" variant="glassmorphism" animated>
                                                <Activity className="mr-2 h-4 w-4" />
                                                {t('startSymptomCheck')}
                                            </Button>
                                        </Link>
                                        <Link href="/consultations">
                                            <Button className="w-full justify-start" variant="glassmorphism" animated>
                                                <Calendar className="mr-2 h-4 w-4" />
                                                {t('bookConsultation')}
                                            </Button>
                                        </Link>
                                        <Button
                                            className="w-full justify-start"
                                            variant="glassmorphism"
                                            animated
                                            onClick={() => setShowMedicalRecords(true)}
                                        >
                                            <FileText className="mr-2 h-4 w-4" />
                                            {t('viewMedicalRecords')}
                                        </Button>
                                        <Link href="/health-records">
                                            <Button className="w-full justify-start" variant="glassmorphism" animated>
                                                <FileText className="mr-2 h-4 w-4" />
                                                {t('healthRecords')}
                                            </Button>
                                        </Link>
                                        <Button
                                            className="w-full justify-start"
                                            variant="glassmorphism"
                                            animated
                                            onClick={() => setShowEmergencyContacts(true)}
                                        >
                                            <Users className="mr-2 h-4 w-4" />
                                            {t('emergencyContacts')}
                                        </Button>
                                    </CardContent>
                                </Card>
                            </FadeIn>

                            <div className="lg:col-span-2">
                                <FadeIn delay={0.3}>
                                    <Card className="border-0 shadow-glow-sm h-full overflow-hidden">
                                        <CardHeader>
                                            <CardTitle className="flex items-center text-xl">
                                                <div className="rounded-full bg-blue-100 dark:bg-blue-900/30 p-1.5 mr-2">
                                                    <MessageSquare className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                                                </div>
                                                {t('recentActivities')}
                                            </CardTitle>
                                            <CardDescription>
                                                {t('recentActivitiesDesc')}
                                            </CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-4 relative">
                                                <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-500 to-purple-500"></div>

                                                <AnimatePresence>
                                                    {recentActivities.map((activity, index) => (
                                                        <motion.div
                                                            key={activity.id}
                                                            className="pl-6 relative"
                                                            initial={{ opacity: 0, x: -10 }}
                                                            animate={{ opacity: 1, x: 0 }}
                                                            transition={{ delay: 0.1 * index }}
                                                            whileHover={{ x: 5 }}
                                                        >
                                                            <div className={`absolute left-0 top-2 w-4 h-4 rounded-full flex items-center justify-center
                                                        ${activity.type === 'symptom_check' ? 'bg-gradient-to-r from-blue-500 to-blue-600' :
                                                                    activity.type === 'consultation' ? 'bg-gradient-to-r from-green-500 to-emerald-600' :
                                                                        activity.type === 'prescription' ? 'bg-gradient-to-r from-purple-500 to-indigo-600' :
                                                                            activity.type === 'emergency' ? 'bg-gradient-to-r from-red-500 to-pink-600' :
                                                                                'bg-gradient-to-r from-amber-500 to-orange-600'}`}
                                                            >
                                                                <div className="w-1.5 h-1.5 rounded-full bg-white"></div>
                                                            </div>

                                                            <div className="bg-white/10 dark:bg-white/5 backdrop-blur-sm rounded-lg p-3 border border-white/10 shadow-glow-xs">
                                                                <div className="flex justify-between">
                                                                    <p className="text-sm font-medium">
                                                                        {activity.title}
                                                                    </p>
                                                                    <p className="text-xs text-gray-500 dark:text-gray-400">
                                                                        {activity.date}
                                                                    </p>
                                                                </div>
                                                                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                                                                    {activity.description}
                                                                </p>
                                                                <div className="flex justify-between items-center mt-2">
                                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
                                                                ${activity.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                                                            activity.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                                                                activity.status === 'active' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300' :
                                                                                    'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300'}`}>
                                                                        {activity.status}
                                                                    </span>
                                                                    <Button variant="ghost" size="sm" className="h-6 rounded-full">
                                                                        <ExternalLink className="h-3 w-3" />
                                                                    </Button>
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </AnimatePresence>

                                                <div className="mt-4 text-center">
                                                    <Button variant="gradient" className="mt-4" animated>
                                                        {t('viewAllActivities')}
                                                    </Button>
                                                </div>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </FadeIn>
                            </div>
                        </div>


                        {
                            <FadeIn delay={0.4}>
                                <Card className="mt-8 border-0 shadow-glow-sm overflow-hidden">
                                    <div className="absolute -right-10 -top-10 w-40 h-40 bg-blue-500/10 rounded-full blur-2xl"></div>
                                    <CardHeader>
                                        <CardTitle className="flex items-center text-xl">
                                            <div className="rounded-full bg-indigo-100 dark:bg-indigo-900/30 p-1.5 mr-2">
                                                <TrendingUp className="h-4 w-4 text-indigo-600 dark:text-indigo-400" />
                                            </div>
                                            {t('healthInsights')}
                                        </CardTitle>
                                        <CardDescription>
                                            {t('healthInsightsDesc')}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="space-y-4">
                                            <motion.div
                                                className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 
                                                 rounded-lg border border-blue-100 dark:border-blue-800/30 relative overflow-hidden"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.5 }}
                                            >
                                                <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-blue-500/10 rounded-full blur-xl"></div>
                                                <h4 className="font-medium text-blue-900 dark:text-blue-300 mb-2 flex items-center">
                                                    <Stethoscope className="mr-1.5 h-4 w-4" /> {t('recommendation')}
                                                </h4>
                                                <p className="text-blue-800 dark:text-blue-200 text-sm">
                                                    {t('healthRecommendation')}
                                                </p>
                                                <Button variant="glassmorphism" size="sm" className="mt-2" animated>
                                                    {t('learnMore')}
                                                </Button>
                                            </motion.div>

                                            <motion.div
                                                className="p-4 bg-gradient-to-r from-emerald-50 to-green-50 dark:from-emerald-900/20 dark:to-green-900/20 
                                                 rounded-lg border border-emerald-100 dark:border-emerald-800/30 relative overflow-hidden"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.7 }}
                                            >
                                                <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-emerald-500/10 rounded-full blur-xl"></div>
                                                <h4 className="font-medium text-emerald-900 dark:text-emerald-300 mb-2 flex items-center">
                                                    <Heart className="mr-1.5 h-4 w-4" /> {t('goodProgress')}
                                                </h4>
                                                <p className="text-emerald-800 dark:text-emerald-200 text-sm">
                                                    {t('improvedScore')}
                                                </p>
                                            </motion.div>

                                            <motion.div
                                                className="p-4 bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/20 dark:to-yellow-900/20 
                                                 rounded-lg border border-amber-100 dark:border-amber-800/30 relative overflow-hidden"
                                                initial={{ opacity: 0, y: 10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: 0.9 }}
                                            >
                                                <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-amber-500/10 rounded-full blur-xl"></div>
                                                <h4 className="font-medium text-amber-900 dark:text-amber-300 mb-2 flex items-center">
                                                    <Bell className="mr-1.5 h-4 w-4" /> {t('reminder')}
                                                </h4>
                                                <p className="text-amber-800 dark:text-amber-200 text-sm">
                                                    {t('medicationReminder')}
                                                </p>
                                            </motion.div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </FadeIn>
                        }

                        {
                            <AnimatePresence>
                                {showMedicalRecords && (
                                    <motion.div
                                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        exit={{ opacity: 0 }}
                                    >
                                        <motion.div
                                            className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md rounded-xl shadow-glow border border-white/20 dark:border-gray-700/30 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
                                            initial={{ scale: 0.9, y: 20 }}
                                            animate={{ scale: 1, y: 0 }}
                                            exit={{ scale: 0.9, y: 20 }}
                                            transition={{ type: "spring", damping: 15 }}
                                        >
                                            <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700/50">
                                                <h2 className="text-xl font-semibold gradient-text bg-gradient-to-r from-blue-600 to-indigo-600">{t('viewMedicalRecords')}</h2>
                                                <Button variant="ghost" size="icon" onClick={() => setShowMedicalRecords(false)} animated>
                                                    <X className="h-5 w-5" />
                                                </Button>
                                            </div>
                                            <div className="p-6">
                                                {isLoadingRecords ? (
                                                    <div className="flex justify-center items-center h-40">
                                                        {/* Loading spinner removed */}
                                                    </div>
                                                ) : healthRecords.length > 0 ? (
                                                    <div className="space-y-4">
                                                        {/* Recent Health Records */}
                                                        <div>
                                                            <h3 className="font-medium text-lg mb-2">{tHealth('title')}</h3>
                                                            <div className="space-y-2">
                                                                {healthRecords.map((record) => (
                                                                    <motion.div
                                                                        key={record._id}
                                                                        initial={{ opacity: 0, x: -10 }}
                                                                        animate={{ opacity: 1, x: 0 }}
                                                                        transition={{ duration: 0.3 }}
                                                                        whileHover={{ x: 5 }}
                                                                    >
                                                                        <Card className="p-3 border-0">
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
                                                                                            variant="glassmorphism"
                                                                                            onClick={() => window.open(record.attachmentUrl, '_blank')}
                                                                                            title={tHealth('viewAttachment')}
                                                                                            animated
                                                                                        >
                                                                                            <ExternalLink className="h-4 w-4" />
                                                                                        </Button>
                                                                                    )}
                                                                                    <Link href={`/health-records?edit=${record._id}`}>
                                                                                        <Button size="sm" variant="glassmorphism" animated>{tHealth('edit')}</Button>
                                                                                    </Link>
                                                                                </div>
                                                                            </div>
                                                                        </Card>
                                                                    </motion.div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="text-center p-6">
                                                        <p className="mb-4 text-gray-500 dark:text-gray-400">{tHealth('noRecords')}</p>
                                                        <Link href="/health-records/new">
                                                            <Button variant="glassmorphism" animated>
                                                                {tHealth('addNewRecord')}
                                                            </Button>
                                                        </Link>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="border-t border-gray-200 dark:border-gray-700/50 p-4 flex justify-between">
                                                <Link href="/health-records">
                                                    <Button variant="outline">
                                                        <FileText className="h-4 w-4 mr-2" />
                                                        {t('viewAllRecords')}
                                                    </Button>
                                                </Link>
                                                <Button variant="outline" onClick={() => setShowMedicalRecords(false)}>
                                                    {t('close')}
                                                </Button>
                                            </div>
                                        </motion.div>
                                    </motion.div>

                                )}
                            </AnimatePresence>
                        }

                        {
                            <AnimatePresence>
                                {showEmergencyContacts && (
                                    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                                        <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                                            <div className="flex justify-between items-center p-4 border-b">
                                                <h2 className="text-xl font-semibold">{t('emergencyContacts')}</h2>
                                                <Button variant="ghost" size="icon" onClick={() => setShowEmergencyContacts(false)}>
                                                    <X className="h-5 w-5" />
                                                </Button>
                                            </div>
                                            <div className="p-6">
                                                <div className="space-y-4">
                                                    <Card className="p-3">
                                                        <div className="flex justify-between items-center">
                                                            <div>
                                                                <p className="font-medium">Dr. Sarah Johnson</p>
                                                                <p className="text-sm text-gray-500">Primary Care Physician</p>
                                                                <p className="text-sm text-gray-700">+1 (555) 123-4567</p>
                                                            </div>
                                                            <Button size="sm" variant="outline">Call</Button>
                                                        </div>
                                                    </Card>
                                                    <Card className="p-3">
                                                        <div className="flex justify-between items-center">
                                                            <div>
                                                                <p className="font-medium">Local Hospital</p>
                                                                <p className="text-sm text-gray-500">Emergency Room</p>
                                                                <p className="text-sm text-gray-700">+1 (555) 987-6543</p>
                                                            </div>
                                                            <Button size="sm" variant="outline">Call</Button>
                                                        </div>
                                                    </Card>
                                                    <Card className="p-3">
                                                        <div className="flex justify-between items-center">
                                                            <div>
                                                                <p className="font-medium">Jane Doe</p>
                                                                <p className="text-sm text-gray-500">Family Contact</p>
                                                                <p className="text-sm text-gray-700">+1 (555) 555-5555</p>
                                                            </div>
                                                            <Button size="sm" variant="outline">Call</Button>
                                                        </div>
                                                    </Card>
                                                    <div className="mt-4">
                                                        <Button className="w-full">Add New Contact</Button>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="border-t p-4 flex justify-end">
                                                <Button variant="outline" onClick={() => setShowEmergencyContacts(false)}>Close</Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </AnimatePresence>
                        }
                    </div>
                </AnimatePresence>
            </div>
        </>
    );
}
