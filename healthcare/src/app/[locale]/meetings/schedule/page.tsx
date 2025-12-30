'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from '@/navigation';
import { useTranslations } from 'next-intl';
import { Calendar, Clock, Video, Phone, MessageSquare, Search, Star, Loader2, ArrowLeft, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';

interface Doctor {
    _id: string;
    name: string;
    email: string;
    specialty: string;
    yearsExperience: number;
    bio: string;
    rating: number;
}

type MeetingType = 'text' | 'audio' | 'video';

export default function ScheduleMeetingPage() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const { success, error: showError } = useToast();
    
    const [step, setStep] = useState(1);
    const [doctors, setDoctors] = useState<Doctor[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    
    const [formData, setFormData] = useState({
        doctorId: '',
        doctorName: '',
        type: 'video' as MeetingType,
        date: '',
        time: '',
        reason: '',
    });

    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin');
        }
    }, [status, router]);

    useEffect(() => {
        const fetchDoctors = async () => {
            try {
                const params = new URLSearchParams();
                if (searchQuery) params.append('search', searchQuery);
                
                const response = await fetch(`/api/doctors?${params.toString()}`);
                if (response.ok) {
                    const data = await response.json();
                    setDoctors(data);
                }
            } catch (err) {
                console.error('Error fetching doctors:', err);
            } finally {
                setLoading(false);
            }
        };

        if (session) {
            fetchDoctors();
        }
    }, [session, searchQuery]);

    const handleDoctorSelect = (doctor: Doctor) => {
        setFormData(prev => ({
            ...prev,
            doctorId: doctor._id,
            doctorName: doctor.name,
        }));
        setStep(2);
    };

    const handleTypeSelect = (type: MeetingType) => {
        setFormData(prev => ({ ...prev, type }));
    };

    const handleSubmit = async () => {
        if (!formData.doctorId || !formData.date || !formData.time || !formData.reason) {
            showError('Please fill in all required fields');
            return;
        }

        setSubmitting(true);
        try {
            const scheduledFor = new Date(`${formData.date}T${formData.time}`);
            
            const response = await fetch('/api/meetings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    doctorId: formData.doctorId,
                    type: formData.type,
                    scheduledFor: scheduledFor.toISOString(),
                    reason: formData.reason,
                }),
            });

            if (!response.ok) {
                const data = await response.json();
                throw new Error(data.error || 'Failed to schedule meeting');
            }

            success('Meeting scheduled successfully! The doctor will be notified.');
            setTimeout(() => router.push('/meetings'), 1500);
        } catch (err) {
            showError(err instanceof Error ? err.message : 'Failed to schedule meeting');
        } finally {
            setSubmitting(false);
        }
    };

    const today = new Date().toISOString().split('T')[0];

    if (status === 'loading' || loading) {
        return (
            <div className="min-h-screen bg-slate-950 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-950 text-white">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-950 via-indigo-950/50 to-slate-900" />
            <div className="absolute inset-0 opacity-40" style={{
                backgroundImage: 'radial-gradient(circle at 30% 20%, rgba(79, 70, 229, 0.25), transparent 50%)'
            }} />

            <div className="relative z-10 max-w-4xl mx-auto px-4 py-8">
                {/* Header */}
                <div className="mb-8">
                    <Button 
                        variant="ghost" 
                        onClick={() => step > 1 ? setStep(step - 1) : router.push('/dashboard')}
                        className="text-slate-400 hover:text-white mb-4"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" /> Back
                    </Button>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-violet-400 bg-clip-text text-transparent">
                        Schedule a Consultation
                    </h1>
                    <p className="text-slate-400 mt-2">Book a meeting with a healthcare provider</p>
                </div>

                {/* Progress Steps */}
                <div className="flex items-center gap-4 mb-8">
                    {[1, 2, 3].map((s) => (
                        <div key={s} className="flex items-center">
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                                step >= s 
                                    ? 'bg-gradient-to-r from-cyan-500 to-violet-500 text-white' 
                                    : 'bg-slate-800 text-slate-500'
                            }`}>
                                {step > s ? <Check className="h-5 w-5" /> : s}
                            </div>
                            {s < 3 && (
                                <div className={`w-16 h-1 mx-2 rounded ${
                                    step > s ? 'bg-gradient-to-r from-cyan-500 to-violet-500' : 'bg-slate-800'
                                }`} />
                            )}
                        </div>
                    ))}
                </div>

                {/* Step 1: Select Doctor */}
                {step === 1 && (
                    <div className="space-y-6">
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-5 w-5 text-slate-400" />
                            <Input
                                placeholder="Search doctors by name or specialty..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-slate-900/50 border-slate-700 text-white placeholder:text-slate-500"
                            />
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            {doctors.length === 0 ? (
                                <div className="col-span-2 text-center py-12 text-slate-400">
                                    No doctors found. Try a different search.
                                </div>
                            ) : (
                                doctors.map((doctor) => (
                                    <Card 
                                        key={doctor._id}
                                        className="bg-slate-900/50 border-slate-700 hover:border-cyan-500/50 cursor-pointer transition-all hover:shadow-lg hover:shadow-cyan-500/10"
                                        onClick={() => handleDoctorSelect(doctor)}
                                    >
                                        <CardHeader className="pb-2">
                                            <div className="flex items-start justify-between">
                                                <div>
                                                    <CardTitle className="text-white">{doctor.name}</CardTitle>
                                                    <p className="text-cyan-400 text-sm">{doctor.specialty}</p>
                                                </div>
                                                {doctor.rating > 0 && (
                                                    <div className="flex items-center gap-1 text-yellow-400">
                                                        <Star className="h-4 w-4 fill-current" />
                                                        <span className="text-sm">{doctor.rating.toFixed(1)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-slate-400 text-sm line-clamp-2">
                                                {doctor.bio || `${doctor.yearsExperience || 0} years of experience`}
                                            </p>
                                        </CardContent>
                                    </Card>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Step 2: Select Type and Schedule */}
                {step === 2 && (
                    <div className="space-y-6">
                        <Card className="bg-slate-900/50 border-slate-700">
                            <CardHeader>
                                <CardTitle className="text-white">Selected Doctor</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-cyan-400 font-medium">{formData.doctorName}</p>
                            </CardContent>
                        </Card>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-3">
                                Consultation Type
                            </label>
                            <div className="grid grid-cols-3 gap-4">
                                {[
                                    { type: 'video' as MeetingType, icon: Video, label: 'Video Call', color: 'from-violet-500 to-purple-600' },
                                    { type: 'audio' as MeetingType, icon: Phone, label: 'Audio Call', color: 'from-cyan-500 to-blue-600' },
                                    { type: 'text' as MeetingType, icon: MessageSquare, label: 'Text Chat', color: 'from-emerald-500 to-teal-600' },
                                ].map(({ type, icon: Icon, label, color }) => (
                                    <button
                                        key={type}
                                        onClick={() => handleTypeSelect(type)}
                                        className={`p-4 rounded-xl border-2 transition-all ${
                                            formData.type === type
                                                ? `border-transparent bg-gradient-to-r ${color} shadow-lg`
                                                : 'border-slate-700 bg-slate-900/50 hover:border-slate-600'
                                        }`}
                                    >
                                        <Icon className={`h-8 w-8 mx-auto mb-2 ${formData.type === type ? 'text-white' : 'text-slate-400'}`} />
                                        <span className={`text-sm font-medium ${formData.type === type ? 'text-white' : 'text-slate-300'}`}>
                                            {label}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="grid gap-4 md:grid-cols-2">
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    <Calendar className="h-4 w-4 inline mr-2" />
                                    Select Date
                                </label>
                                <Input
                                    type="date"
                                    min={today}
                                    value={formData.date}
                                    onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
                                    className="bg-slate-900/50 border-slate-700 text-white"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-300 mb-2">
                                    <Clock className="h-4 w-4 inline mr-2" />
                                    Select Time
                                </label>
                                <Input
                                    type="time"
                                    value={formData.time}
                                    onChange={(e) => setFormData(prev => ({ ...prev, time: e.target.value }))}
                                    className="bg-slate-900/50 border-slate-700 text-white"
                                />
                            </div>
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-slate-300 mb-2">
                                Reason for Consultation
                            </label>
                            <textarea
                                value={formData.reason}
                                onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value }))}
                                placeholder="Describe your symptoms or reason for the consultation..."
                                className="w-full min-h-[120px] rounded-xl bg-slate-900/50 border border-slate-700 p-4 text-white placeholder:text-slate-500 focus:border-cyan-500 focus:outline-none"
                            />
                        </div>

                        <Button
                            onClick={() => setStep(3)}
                            disabled={!formData.date || !formData.time || !formData.reason}
                            className="w-full bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600"
                        >
                            Review Booking
                        </Button>
                    </div>
                )}

                {/* Step 3: Review and Confirm */}
                {step === 3 && (
                    <div className="space-y-6">
                        <Card className="bg-slate-900/50 border-slate-700">
                            <CardHeader>
                                <CardTitle className="text-white">Booking Summary</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center py-3 border-b border-slate-700">
                                    <span className="text-slate-400">Doctor</span>
                                    <span className="text-white font-medium">{formData.doctorName}</span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-slate-700">
                                    <span className="text-slate-400">Type</span>
                                    <span className="text-white font-medium capitalize flex items-center gap-2">
                                        {formData.type === 'video' && <Video className="h-4 w-4 text-violet-400" />}
                                        {formData.type === 'audio' && <Phone className="h-4 w-4 text-cyan-400" />}
                                        {formData.type === 'text' && <MessageSquare className="h-4 w-4 text-emerald-400" />}
                                        {formData.type} Consultation
                                    </span>
                                </div>
                                <div className="flex justify-between items-center py-3 border-b border-slate-700">
                                    <span className="text-slate-400">Date & Time</span>
                                    <span className="text-white font-medium">
                                        {new Date(`${formData.date}T${formData.time}`).toLocaleString()}
                                    </span>
                                </div>
                                <div className="py-3">
                                    <span className="text-slate-400 block mb-2">Reason</span>
                                    <p className="text-white bg-slate-800/50 rounded-lg p-3">{formData.reason}</p>
                                </div>
                            </CardContent>
                        </Card>

                        <div className="flex gap-4">
                            <Button
                                variant="outline"
                                onClick={() => setStep(2)}
                                className="flex-1 border-slate-700 text-slate-300 hover:text-white"
                            >
                                Edit Details
                            </Button>
                            <Button
                                onClick={handleSubmit}
                                disabled={submitting}
                                className="flex-1 bg-gradient-to-r from-cyan-500 to-violet-500 hover:from-cyan-600 hover:to-violet-600"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Scheduling...
                                    </>
                                ) : (
                                    'Confirm Booking'
                                )}
                            </Button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
