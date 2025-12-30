'use client';

import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/navigation';
import { Link } from '@/navigation';
import { useState, useEffect } from 'react';
import { Users, Calendar, Clock, FileText, Bell, Video, Phone, MessageSquare, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

// Type definitions for our data
interface Patient {
    id: string;
    name: string;
    email: string;
    profilePicture?: string;
    lastLogin?: Date;
}

interface Meeting {
    _id: string;
    type: 'text' | 'audio' | 'video';
    status: 'scheduled' | 'active' | 'ended' | 'cancelled';
    scheduledFor: string;
    reason: string;
    roomId: string;
    patient: {
        _id: string;
        name: string;
        email: string;
    } | null;
}

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    read: boolean;
    timestamp: string;
    referenceId?: string;
    metadata?: {
        meetingType?: string;
        patientName?: string;
        scheduledFor?: string;
    };
}

interface DashboardData {
    stats: {
        totalConsultations: number;
        completedConsultations: number;
        uniquePatientCount: number;
        todayConsultations: number;
    };
    upcomingConsultations: Meeting[];
    recentPatients: Patient[];
}

export default function ProviderDashboardPage() {
    const { data: session, status } = useSession();
    const t = useTranslations('ProviderDashboard');
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('overview');
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Fetch meetings and notifications
    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                
                // Fetch meetings
                const meetingsRes = await fetch('/api/meetings');
                if (meetingsRes.ok) {
                    const meetingsData = await meetingsRes.json();
                    setMeetings(meetingsData);
                }

                // Fetch notifications
                const notifRes = await fetch('/api/notifications');
                if (notifRes.ok) {
                    const notifData = await notifRes.json();
                    setNotifications(notifData.notifications || []);
                }
            } catch (err) {
                console.error('Failed to fetch data:', err);
                setError('Failed to load dashboard data');
            } finally {
                setLoading(false);
            }
        };

        if (status === 'authenticated' && session?.user?.role === 'provider') {
            fetchData();
            // Poll for updates every 30 seconds
            const interval = setInterval(fetchData, 30000);
            return () => clearInterval(interval);
        } else if (status === 'authenticated' && session?.user?.role !== 'provider') {
            setLoading(false);
        }
    }, [session, status]);

    const markNotificationRead = async (notificationId: string) => {
        await fetch('/api/notifications', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ notificationId }),
        });
        setNotifications(prev => 
            prev.map(n => n.id === notificationId ? { ...n, read: true } : n)
        );
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'video': return <Video className="h-4 w-4 text-violet-400" />;
            case 'audio': return <Phone className="h-4 w-4 text-cyan-400" />;
            case 'text': return <MessageSquare className="h-4 w-4 text-emerald-400" />;
            default: return <Video className="h-4 w-4 text-violet-400" />;
        }
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'active':
                return <span className="px-2 py-1 rounded-full text-xs bg-green-500/20 text-green-400 animate-pulse">Active</span>;
            case 'scheduled':
                return <span className="px-2 py-1 rounded-full text-xs bg-blue-500/20 text-blue-400">Scheduled</span>;
            default:
                return <span className="px-2 py-1 rounded-full text-xs bg-slate-500/20 text-slate-400">{status}</span>;
        }
    };

    const unreadCount = notifications.filter(n => !n.read).length;
    const activeMeetings = meetings.filter(m => m.status === 'active');
    const scheduledMeetings = meetings.filter(m => m.status === 'scheduled');

    // Show loading only for initial session check
    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-violet-400" />
            </div>
        );
    }

    if (!session) {
        return null;
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-violet-950/30 to-slate-900" />
            <div className="absolute inset-0 opacity-40" style={{
                backgroundImage: 'radial-gradient(circle at 70% 20%, rgba(139, 92, 246, 0.25), transparent 50%)'
            }} />

            <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
                            Doctor Dashboard
                        </h1>
                        <p className="text-slate-400 mt-1">Welcome back, Dr. {session.user.name}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            className="relative border-slate-700 text-slate-300 hover:text-white"
                            onClick={() => setActiveTab('notifications')}
                        >
                            <Bell className="h-4 w-4 mr-2" />
                            Notifications
                            {unreadCount > 0 && (
                                <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                                    {unreadCount}
                                </span>
                            )}
                        </Button>
                    </div>
                </div>

                {/* Active Meetings Alert */}
                {activeMeetings.length > 0 && (
                    <div className="mb-6 p-4 rounded-xl bg-green-500/20 border border-green-500/30 animate-pulse">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                                    <Video className="h-5 w-5 text-white" />
                                </div>
                                <div>
                                    <h3 className="font-medium text-green-400">Active Meeting</h3>
                                    <p className="text-sm text-green-300/70">
                                        {activeMeetings[0].patient?.name} is waiting for you
                                    </p>
                                </div>
                            </div>
                            <Link href={`/meetings/room/${activeMeetings[0]._id}`}>
                                <Button className="bg-green-600 hover:bg-green-700">
                                    Join Now
                                </Button>
                            </Link>
                        </div>
                    </div>
                )}

                {/* Stats Cards */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
                    <Card className="bg-slate-900/50 border-slate-700">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-slate-400 text-sm">Active Meetings</p>
                                    <p className="text-3xl font-bold text-green-400">{activeMeetings.length}</p>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-green-500/20 flex items-center justify-center">
                                    <Video className="h-6 w-6 text-green-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-900/50 border-slate-700">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-slate-400 text-sm">Scheduled</p>
                                    <p className="text-3xl font-bold text-blue-400">{scheduledMeetings.length}</p>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                                    <Calendar className="h-6 w-6 text-blue-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-900/50 border-slate-700">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-slate-400 text-sm">Unread Alerts</p>
                                    <p className="text-3xl font-bold text-violet-400">{unreadCount}</p>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-violet-500/20 flex items-center justify-center">
                                    <Bell className="h-6 w-6 text-violet-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-900/50 border-slate-700">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-slate-400 text-sm">Total Patients</p>
                                    <p className="text-3xl font-bold text-cyan-400">{meetings.length}</p>
                                </div>
                                <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center">
                                    <Users className="h-6 w-6 text-cyan-400" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs */}
                <div className="flex gap-2 mb-6 border-b border-slate-800 pb-4">
                    {['overview', 'notifications'].map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                                activeTab === tab
                                    ? 'bg-gradient-to-r from-violet-500 to-purple-500 text-white'
                                    : 'text-slate-400 hover:text-white'
                            }`}
                        >
                            {tab.charAt(0).toUpperCase() + tab.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Overview Tab */}
                {activeTab === 'overview' && (
                    <div className="grid gap-6 md:grid-cols-2">
                        {/* Upcoming Meetings */}
                        <Card className="bg-slate-900/50 border-slate-700">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <Calendar className="h-5 w-5 text-violet-400" />
                                    Upcoming Meetings
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {scheduledMeetings.length === 0 ? (
                                    <p className="text-slate-500 text-center py-8">No scheduled meetings</p>
                                ) : (
                                    <div className="space-y-3">
                                        {scheduledMeetings.slice(0, 5).map((meeting) => (
                                            <div
                                                key={meeting._id}
                                                className="flex items-center justify-between p-3 rounded-lg bg-slate-800/50 hover:bg-slate-800 transition-all"
                                            >
                                                <div className="flex items-center gap-3">
                                                    {getTypeIcon(meeting.type)}
                                                    <div>
                                                        <p className="text-white font-medium">{meeting.patient?.name || 'Unknown'}</p>
                                                        <p className="text-slate-400 text-sm">
                                                            {new Date(meeting.scheduledFor).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                                <Link href={`/meetings/room/${meeting._id}`}>
                                                    <Button size="sm" variant="outline" className="border-slate-600">
                                                        View
                                                    </Button>
                                                </Link>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Recent Notifications */}
                        <Card className="bg-slate-900/50 border-slate-700">
                            <CardHeader>
                                <CardTitle className="text-white flex items-center gap-2">
                                    <Bell className="h-5 w-5 text-violet-400" />
                                    Recent Notifications
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {notifications.length === 0 ? (
                                    <p className="text-slate-500 text-center py-8">No notifications</p>
                                ) : (
                                    <div className="space-y-3">
                                        {notifications.slice(0, 5).map((notif) => (
                                            <div
                                                key={notif.id}
                                                className={`p-3 rounded-lg transition-all cursor-pointer ${
                                                    notif.read ? 'bg-slate-800/30' : 'bg-violet-500/10 border border-violet-500/30'
                                                }`}
                                                onClick={() => !notif.read && markNotificationRead(notif.id)}
                                            >
                                                <div className="flex items-start justify-between">
                                                    <div>
                                                        <p className="text-white font-medium">{notif.title}</p>
                                                        <p className="text-slate-400 text-sm">{notif.message}</p>
                                                    </div>
                                                    {!notif.read && (
                                                        <span className="w-2 h-2 rounded-full bg-violet-400" />
                                                    )}
                                                </div>
                                                <p className="text-slate-500 text-xs mt-2">
                                                    {new Date(notif.timestamp).toLocaleString()}
                                                </p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Notifications Tab */}
                {activeTab === 'notifications' && (
                    <Card className="bg-slate-900/50 border-slate-700">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle className="text-white">All Notifications</CardTitle>
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-slate-600"
                                onClick={async () => {
                                    await fetch('/api/notifications', {
                                        method: 'PATCH',
                                        headers: { 'Content-Type': 'application/json' },
                                        body: JSON.stringify({ markAllRead: true }),
                                    });
                                    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                                }}
                            >
                                Mark All Read
                            </Button>
                        </CardHeader>
                        <CardContent>
                            {notifications.length === 0 ? (
                                <p className="text-slate-500 text-center py-12">No notifications yet</p>
                            ) : (
                                <div className="space-y-3">
                                    {notifications.map((notif) => (
                                        <div
                                            key={notif.id}
                                            className={`p-4 rounded-lg transition-all ${
                                                notif.read ? 'bg-slate-800/30' : 'bg-violet-500/10 border border-violet-500/30'
                                            }`}
                                        >
                                            <div className="flex items-start justify-between">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2">
                                                        <p className="text-white font-medium">{notif.title}</p>
                                                        {!notif.read && (
                                                            <span className="px-2 py-0.5 rounded-full text-xs bg-violet-500/30 text-violet-300">New</span>
                                                        )}
                                                    </div>
                                                    <p className="text-slate-400 mt-1">{notif.message}</p>
                                                    <p className="text-slate-500 text-sm mt-2">
                                                        {new Date(notif.timestamp).toLocaleString()}
                                                    </p>
                                                </div>
                                                {notif.referenceId && (
                                                    <Link href={`/meetings/room/${notif.referenceId}`}>
                                                        <Button size="sm" className="bg-violet-600 hover:bg-violet-700">
                                                            View Meeting
                                                        </Button>
                                                    </Link>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
    );
}
