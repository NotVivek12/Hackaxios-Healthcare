'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from '@/navigation';
import { Link } from '@/navigation';
import { Video, Phone, MessageSquare, Calendar, Clock, Plus, Loader2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Meeting {
    _id: string;
    type: 'text' | 'audio' | 'video';
    status: 'scheduled' | 'active' | 'ended' | 'cancelled';
    scheduledFor: string;
    reason: string;
    roomId: string;
    doctor: {
        _id: string;
        name: string;
        email: string;
        specialty?: string;
    } | null;
    patient: {
        _id: string;
        name: string;
        email: string;
    } | null;
}

export default function MeetingsPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const [meetings, setMeetings] = useState<Meeting[]>([]);
    const [loading, setLoading] = useState(false);
    const [filter, setFilter] = useState<'all' | 'scheduled' | 'active' | 'ended'>('all');

    useEffect(() => {
        const fetchMeetings = async () => {
            try {
                setLoading(true);
                const params = new URLSearchParams();
                if (filter !== 'all') {
                    params.append('status', filter);
                }
                
                const response = await fetch(`/api/meetings?${params.toString()}`);
                if (response.ok) {
                    const data = await response.json();
                    setMeetings(data);
                }
            } catch (err) {
                console.error('Error fetching meetings:', err);
            } finally {
                setLoading(false);
            }
        };

        if (status === 'authenticated' && session) {
            fetchMeetings();
            // Poll for updates every 30 seconds
            const interval = setInterval(fetchMeetings, 30000);
            return () => clearInterval(interval);
        }
    }, [session, status, filter]);

    const getStatusColor = (status: string) => {
        switch (status) {
            case 'active': return 'bg-green-500/20 text-green-400 border-green-500/30';
            case 'scheduled': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
            case 'ended': return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
            case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
            default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
        }
    };

    const getTypeIcon = (type: string) => {
        switch (type) {
            case 'video': return <Video className="h-5 w-5 text-violet-400" />;
            case 'audio': return <Phone className="h-5 w-5 text-cyan-400" />;
            case 'text': return <MessageSquare className="h-5 w-5 text-emerald-400" />;
            default: return <Video className="h-5 w-5 text-violet-400" />;
        }
    };

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return {
            date: date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' }),
            time: date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }),
        };
    };

    const isPatient = session?.user?.role === 'patient';

    if (status === 'loading') {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
            </div>
        );
    }

    if (!session) {
        return null;
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950/50 to-slate-900" />
            <div className="absolute inset-0 opacity-40" style={{
                backgroundImage: 'radial-gradient(circle at 30% 20%, rgba(79, 70, 229, 0.25), transparent 50%)'
            }} />

            <div className="relative z-10 max-w-6xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                            My Meetings
                        </h1>
                        <p className="text-slate-400 mt-1">
                            {isPatient ? 'View and join your scheduled consultations' : 'Manage your patient consultations'}
                        </p>
                    </div>
                    {isPatient && (
                        <Link href="/meetings/schedule">
                            <Button className="bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600">
                                <Plus className="h-4 w-4 mr-2" />
                                Schedule Meeting
                            </Button>
                        </Link>
                    )}
                </div>

                {/* Filters */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    {(['all', 'active', 'scheduled', 'ended'] as const).map((f) => (
                        <button
                            key={f}
                            onClick={() => setFilter(f)}
                            className={`px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
                                filter === f
                                    ? 'bg-gradient-to-r from-cyan-500 to-violet-500 text-white'
                                    : 'bg-slate-800 text-slate-400 hover:text-white'
                            }`}
                        >
                            {f === 'all' ? 'All Meetings' : f.charAt(0).toUpperCase() + f.slice(1)}
                        </button>
                    ))}
                </div>

                {/* Meetings List */}
                {meetings.length === 0 ? (
                    <Card className="bg-slate-900/50 border-slate-700">
                        <CardContent className="py-12 text-center">
                            <Calendar className="h-12 w-12 mx-auto text-slate-600 mb-4" />
                            <h3 className="text-xl font-medium text-slate-300 mb-2">No meetings found</h3>
                            <p className="text-slate-500 mb-6">
                                {isPatient 
                                    ? "You don't have any scheduled meetings yet."
                                    : "No patient meetings scheduled."}
                            </p>
                            {isPatient && (
                                <Link href="/meetings/schedule">
                                    <Button className="bg-gradient-to-r from-cyan-500 to-violet-500">
                                        Schedule Your First Meeting
                                    </Button>
                                </Link>
                            )}
                        </CardContent>
                    </Card>
                ) : (
                    <div className="grid gap-4">
                        {meetings.map((meeting) => {
                            const { date, time } = formatDateTime(meeting.scheduledFor);
                            const otherParty = isPatient ? meeting.doctor : meeting.patient;
                            
                            return (
                                <Card 
                                    key={meeting._id}
                                    className="bg-slate-900/50 border-slate-700 hover:border-slate-600 transition-all"
                                >
                                    <CardContent className="p-6">
                                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                                            {/* Type Icon */}
                                            <div className="flex items-center gap-4 flex-1">
                                                <div className="w-12 h-12 rounded-full bg-slate-800 flex items-center justify-center">
                                                    {getTypeIcon(meeting.type)}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-medium text-white capitalize">
                                                            {meeting.type} Consultation
                                                        </h3>
                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(meeting.status)}`}>
                                                            {meeting.status}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-4 text-sm text-slate-400">
                                                        <span className="flex items-center gap-1">
                                                            <User className="h-4 w-4" />
                                                            {otherParty?.name || 'Unknown'}
                                                            {!isPatient && meeting.doctor?.specialty && (
                                                                <span className="text-slate-500">• {meeting.doctor.specialty}</span>
                                                            )}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Date/Time */}
                                            <div className="flex items-center gap-4 text-slate-400">
                                                <div className="text-right">
                                                    <div className="flex items-center gap-1 text-sm">
                                                        <Calendar className="h-4 w-4" />
                                                        {date}
                                                    </div>
                                                    <div className="flex items-center gap-1 text-sm">
                                                        <Clock className="h-4 w-4" />
                                                        {time}
                                                    </div>
                                                </div>

                                                {/* Action Button */}
                                                {(meeting.status === 'active' || meeting.status === 'scheduled') && (
                                                    <Link href={`/meetings/room/${meeting._id}`}>
                                                        <Button 
                                                            className={`${
                                                                meeting.status === 'active'
                                                                    ? 'bg-green-600 hover:bg-green-700 animate-pulse'
                                                                    : 'bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600'
                                                            }`}
                                                        >
                                                            {meeting.status === 'active' ? 'Join Now' : 'Enter Room'}
                                                        </Button>
                                                    </Link>
                                                )}
                                            </div>
                                        </div>

                                        {/* Reason */}
                                        <div className="mt-4 pt-4 border-t border-slate-700">
                                            <p className="text-sm text-slate-400">
                                                <span className="text-slate-500">Reason:</span> {meeting.reason}
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
