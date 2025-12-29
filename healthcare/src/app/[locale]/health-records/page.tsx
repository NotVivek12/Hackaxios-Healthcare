'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useTranslations } from 'next-intl';
import { FilePlus, Filter, Search, Loader2, RefreshCcw, Share2, Clock, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { HealthRecordCard } from '@/components/health-records/health-record-card';
import { HealthRecordForm } from '@/components/health-records/health-record-form';
import { IHealthRecord } from '@/models/HealthRecord';
import { FadeIn, StaggerContainer } from '@/components/animations/motion-effects';
import { useRouter } from '@/navigation';

// Define a client-side type that includes MongoDB's _id
interface HealthRecord extends Omit<IHealthRecord, 'userId' | 'date' | 'createdAt' | 'updatedAt'> {
    _id: string;
    date: string; // Date is stored as string in the client
    createdAt: string;
    updatedAt: string;
}

export default function HealthRecordsPage() {
    const t = useTranslations('HealthRecords');
    const { success, error: showError } = useToast();
    const router = useRouter();

    const [records, setRecords] = useState<HealthRecord[]>([]);
    const [filteredRecords, setFilteredRecords] = useState<HealthRecord[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedType, setSelectedType] = useState<string>('');
    const [showForm, setShowForm] = useState(false);
    const [editingRecord, setEditingRecord] = useState<HealthRecord | null>(null);

    const successRef = useRef(success);
    const errorRef = useRef(showError);

    useEffect(() => {
        successRef.current = success;
    }, [success]);

    useEffect(() => {
        errorRef.current = showError;
    }, [showError]);

    const notifySuccess = useCallback((message: string) => {
        successRef.current?.(message);
    }, []);

    const notifyError = useCallback((message: string) => {
        errorRef.current?.(message);
    }, []);

    const stats = useMemo(() => {
        if (records.length === 0) {
            return {
                total: 0,
                shared: 0,
                privatePercentage: 100,
                lastUpdated: t('noRecords')
            };
        }

        const sharedCount = records.filter(record => record.isShared).length;
        const latestDate = records.reduce<Date | null>((latest, record) => {
            const dateValue = new Date(record.updatedAt || record.date || record.createdAt);
            if (!latest || dateValue > latest) {
                return dateValue;
            }
            return latest;
        }, null);

        return {
            total: records.length,
            shared: sharedCount,
            privatePercentage: Math.max(0, Math.round(((records.length - sharedCount) / records.length) * 100)),
            lastUpdated: latestDate ? latestDate.toLocaleDateString() : t('noRecords')
        };
    }, [records, t]);

    const typeBreakdown = useMemo(() => {
        const counts = records.reduce<Record<string, number>>((acc, record) => {
            const key = record.type || 'other';
            acc[key] = (acc[key] || 0) + 1;
            return acc;
        }, {});

        return [
            { key: 'allergy', label: t('recordType.allergy'), count: counts.allergy || 0, accent: 'from-rose-500/40 via-transparent to-transparent' },
            { key: 'medication', label: t('recordType.medication'), count: counts.medication || 0, accent: 'from-blue-500/40 via-transparent to-transparent' },
            { key: 'condition', label: t('recordType.condition'), count: counts.condition || 0, accent: 'from-fuchsia-500/40 via-transparent to-transparent' },
            { key: 'diagnosis', label: t('recordType.diagnosis'), count: counts.diagnosis || 0, accent: 'from-orange-500/40 via-transparent to-transparent' },
            { key: 'vaccination', label: t('recordType.vaccination'), count: counts.vaccination || 0, accent: 'from-emerald-500/40 via-transparent to-transparent' },
            { key: 'lab', label: t('recordType.lab'), count: counts.lab || 0, accent: 'from-cyan-500/40 via-transparent to-transparent' },
            { key: 'other', label: t('recordType.other'), count: counts.other || 0, accent: 'from-slate-500/40 via-transparent to-transparent' }
        ];
    }, [records, t]);

    const recordTypeOptions = useMemo(() => ([
        { value: '', label: t('allTypes') },
        { value: 'allergy', label: t('recordType.allergy') },
        { value: 'medication', label: t('recordType.medication') },
        { value: 'condition', label: t('recordType.condition') },
        { value: 'diagnosis', label: t('recordType.diagnosis') },
        { value: 'vaccination', label: t('recordType.vaccination') },
        { value: 'lab', label: t('recordType.lab') },
        { value: 'other', label: t('recordType.other') }
    ]), [t]);

    const statsCards = useMemo(() => ([
        {
            key: 'total',
            label: t('stats.total'),
            value: stats.total.toLocaleString(),
            helper: t('title'),
            icon: FilePlus,
            accent: 'from-emerald-500/30 via-transparent to-transparent'
        },
        {
            key: 'shared',
            label: t('stats.shared'),
            value: stats.shared.toLocaleString(),
            helper: t('shared'),
            icon: Share2,
            accent: 'from-sky-500/30 via-transparent to-transparent'
        },
        {
            key: 'updated',
            label: t('stats.lastUpdated'),
            value: stats.lastUpdated,
            helper: t('recordDate'),
            icon: Clock,
            accent: 'from-purple-500/30 via-transparent to-transparent'
        },
        {
            key: 'private',
            label: t('stats.private'),
            value: `${stats.privatePercentage}%`,
            helper: t('subtitle'),
            icon: Shield,
            accent: 'from-amber-500/30 via-transparent to-transparent'
        }
    ]), [stats, t]);

    // Handle URL query parameters for direct editing
    useEffect(() => {
        // Check if we have a URL parameter for editing
        const params = new URLSearchParams(window.location.search);
        const editId = params.get('edit');

        if (editId) {
            const record = records.find(r => r._id === editId);
            if (record) {
                setEditingRecord(record);
            }
        }
    }, [records]);

    const fetchRecords = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/health-records', { credentials: 'include' });
            if (!response.ok) {
                if (response.status === 401) {
                    router.push('/auth/signin');
                    return;
                }
                throw new Error('Failed to fetch records');
            }

            const data = await response.json();
            setRecords(data.records);
        } catch (error) {
            console.error('Error fetching health records:', error);
            notifyError(t('fetchError'));
        } finally {
            setIsLoading(false);
            setIsRefreshing(false);
        }
    }, [router, notifyError, t]);

    // Fetch records on component mount
    useEffect(() => {
        fetchRecords();
    }, [fetchRecords]);

    const handleRefresh = useCallback(async () => {
        setIsRefreshing(true);
        await fetchRecords();
    }, [fetchRecords]);

    // Filter records when search or type filter changes
    const filterRecords = useCallback(() => {
        let filtered = [...records];

        // Apply type filter if selected
        if (selectedType) {
            filtered = filtered.filter(record => record.type === selectedType);
        }

        // Apply search filter if query exists
        if (searchQuery.trim()) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(record =>
                record.title.toLowerCase().includes(query) ||
                record.description.toLowerCase().includes(query) ||
                (record.notes && record.notes.toLowerCase().includes(query))
            );
        }

        setFilteredRecords(filtered);
    }, [records, searchQuery, selectedType]);

    const handleCreateRecord = async (data: Omit<IHealthRecord, 'userId' | 'createdAt' | 'updatedAt'>) => {
        try {
            const response = await fetch('/api/health-records', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Failed to create record');

            const newRecord = await response.json();
            setRecords(prev => [newRecord, ...prev]);
            setShowForm(false);
            notifySuccess(t('createSuccess'));
        } catch (error) {
            console.error('Error creating health record:', error);
            throw error; // Propagate to form for handling
        }
    };

    const handleUpdateRecord = async (data: Partial<Omit<IHealthRecord, 'userId' | 'createdAt' | 'updatedAt'>>) => {
        if (!editingRecord) return;

        try {
            const response = await fetch(`/api/health-records/${editingRecord._id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Failed to update record');

            const updatedRecord = await response.json();
            setRecords(prev =>
                prev.map(record =>
                    record._id === updatedRecord._id ? updatedRecord : record
                )
            );

            setEditingRecord(null);
            notifySuccess(t('updateSuccess'));
        } catch (error) {
            console.error('Error updating health record:', error);
            throw error; // Propagate to form for handling
        }
    };

    const handleDeleteRecord = async (id: string) => {
        try {
            const response = await fetch(`/api/health-records/${id}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            
            if (response.status === 401) {
                router.push('/auth/signin');
                return;
            }

            if (!response.ok) throw new Error('Failed to delete record');

            setRecords(prev => prev.filter(record => record._id !== id));
            notifySuccess(t('deleteSuccess'));
        } catch (error) {
            console.error('Error deleting health record:', error);
            notifyError(t('deleteError'));
        }
    };

    const handleToggleShare = async (id: string, isShared: boolean) => {
        try {
            const record = records.find(r => r._id === id);
            if (!record) return;

            const response = await fetch(`/api/health-records/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...record, isShared }),
                credentials: 'include'
            });

            if (!response.ok) throw new Error('Failed to update sharing settings');

            const updatedRecord = await response.json();
            setRecords(prev =>
                prev.map(record =>
                    record._id === updatedRecord._id ? updatedRecord : record
                )
            );

            notifySuccess(isShared ? t('sharedSuccess') : t('unsharedSuccess'));
        } catch (error) {
            console.error('Error toggling share status:', error);
            throw error;
        }
    };

    const handleEditRecord: (id: string) => void = (id: string) => {
        const record = records.find(r => r._id === id);
        if (record) {
            setEditingRecord(record);
        }
    };

    const handleCancelForm = () => {
        setShowForm(false);
        setEditingRecord(null);
    };

    const handleShareRecord = async (id: string) => {
        try {
            const record = records.find(r => r._id === id);
            if (!record) return;

            // Here you would typically send the record ID to your backend
            // to handle the sharing logic, e.g., sending an email to the provider
            const response = await fetch(`/api/health-records/share/${id}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ recordId: id })
            });

            if (!response.ok) throw new Error('Failed to share record');

            notifySuccess(t('shareSuccess'));
        } catch (error) {
            console.error('Error sharing health record:', error);
            notifyError(t('shareError'));
        }
    };

    // Filter records when search or type filter changes
    useEffect(() => {
        filterRecords();
    }, [filterRecords]);

    if (showForm || editingRecord) {
        return (
            <div className="future-page relative min-h-screen bg-slate-950 py-12 px-4 text-white sm:px-6 lg:px-8">
                <div className="mx-auto max-w-4xl">
                    <Card className="border-white/10 bg-white/[0.03] backdrop-blur">
                        <CardContent className="pt-8">
                            <HealthRecordForm
                                initialData={editingRecord || undefined}
                                onSubmit={editingRecord ? handleUpdateRecord : handleCreateRecord}
                                onCancel={handleCancelForm}
                            />
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="future-page relative min-h-screen overflow-hidden bg-slate-950 text-white">
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-950 to-slate-950" aria-hidden="true" />
            <div
                className="absolute inset-0 opacity-30"
                aria-hidden="true"
                style={{
                    backgroundImage:
                        'linear-gradient(120deg, rgba(255,255,255,0.08) 1px, transparent 1px), linear-gradient(rgba(255,255,255,0.04) 1px, transparent 1px)',
                    backgroundSize: '120px 120px'
                }}
            />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.25),_transparent_55%)]" aria-hidden="true" />

            <div className="relative z-10 py-24 px-4 sm:px-6 lg:px-8">
                <div className="mx-auto max-w-7xl">
                    <StaggerContainer className="space-y-10">
                        <FadeIn className="flex flex-col gap-6 text-center md:text-left">
                            <div>
                                <p className="text-xs font-semibold uppercase tracking-[0.4em] text-emerald-300/80">
                                    {t('subtitle')}
                                </p>
                                <h1 className="mt-4 text-4xl font-bold text-white md:text-5xl">
                                    {t('title')}
                                </h1>
                                <p className="mt-4 max-w-3xl text-lg text-slate-300">
                                    {t('createFirstRecord')}
                                </p>
                            </div>
                            <div className="flex flex-wrap justify-center gap-3 md:justify-start">
                                <Button
                                    onClick={() => setShowForm(true)}
                                    variant="gradient"
                                    size="lg"
                                    className="px-8"
                                    animated
                                >
                                    <FilePlus className="mr-2 h-5 w-5" />
                                    {t('addRecord')}
                                </Button>
                                <Button
                                    onClick={handleRefresh}
                                    variant="glassmorphism"
                                    size="lg"
                                    className="px-8 text-white"
                                    disabled={isRefreshing}
                                >
                                    {isRefreshing || isLoading ? (
                                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                                    ) : (
                                        <RefreshCcw className="mr-2 h-5 w-5" />
                                    )}
                                    {t('actions.refresh')}
                                </Button>
                            </div>
                        </FadeIn>

                        <FadeIn delay={0.1}>
                            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                                {statsCards.map(card => {
                                    const Icon = card.icon;
                                    return (
                                        <div
                                            key={card.key}
                                            className="relative overflow-hidden rounded-2xl border border-white/10 bg-white/[0.04] p-6 backdrop-blur"
                                        >
                                            <div className={`absolute inset-0 bg-gradient-to-br ${card.accent}`} aria-hidden="true" />
                                            <div className="relative flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm text-white/70">{card.label}</p>
                                                    <p className="mt-2 text-3xl font-semibold">{card.value}</p>
                                                    <p className="mt-1 text-xs text-white/60">{card.helper}</p>
                                                </div>
                                                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/10">
                                                    <Icon className="h-5 w-5 text-white" />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </FadeIn>

                        {records.length > 0 && (
                            <FadeIn delay={0.15}>
                                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                                    {typeBreakdown.map(type => (
                                        <div
                                            key={type.key}
                                            className="rounded-2xl border border-white/10 bg-white/[0.02] p-4 backdrop-blur"
                                        >
                                            <p className="text-sm text-white/60">{type.label}</p>
                                            <p className="mt-2 text-2xl font-semibold">{type.count}</p>
                                            <div className="mt-4 h-1.5 rounded-full bg-white/10">
                                                <div
                                                    className="h-full rounded-full bg-emerald-400"
                                                    style={{
                                                        width: `${records.length ? Math.min(100, (type.count / records.length) * 100) : 0}%`
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </FadeIn>
                        )}

                        <FadeIn delay={0.2}>
                            <Card className="border-white/10 bg-white/[0.04] backdrop-blur">
                                <CardContent className="space-y-6 pt-6">
                                    <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                                        <div className="w-full md:max-w-xl">
                                            <div className="relative">
                                                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-white/40" />
                                                <Input
                                                    className="h-12 rounded-2xl border-white/10 bg-white/[0.03] pl-10 text-white placeholder:text-white/50"
                                                    placeholder={t('searchPlaceholder')}
                                                    value={searchQuery}
                                                    onChange={(e) => setSearchQuery(e.target.value)}
                                                />
                                            </div>
                                        </div>
                                        <div className="flex w-full flex-col gap-3 md:flex-row md:items-center md:justify-end">
                                            <div className="flex items-center gap-2 text-white/70">
                                                <Filter className="h-4 w-4" />
                                                <label className="text-sm" htmlFor="record-type-filter">
                                                    {t('filterByType')}
                                                </label>
                                            </div>
                                            <select
                                                id="record-type-filter"
                                                className="h-12 rounded-2xl border border-white/10 bg-white/[0.03] px-4 text-white"
                                                value={selectedType}
                                                onChange={(e) => setSelectedType(e.target.value)}
                                                aria-label={t('filterByType')}
                                            >
                                                {recordTypeOptions.map(option => (
                                                    <option key={option.value || 'all'} value={option.value} className="text-slate-900">
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </FadeIn>

                        <FadeIn delay={0.3}>
                            {isLoading ? (
                                <div className="flex h-72 items-center justify-center">
                                    <Loader2 className="h-10 w-10 animate-spin text-emerald-300" />
                                </div>
                            ) : filteredRecords.length > 0 ? (
                                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                                    {filteredRecords.map(record => (
                                        <div key={record._id} className="rounded-3xl border border-white/5 bg-white/[0.03] p-1 backdrop-blur">
                                            <div className="rounded-3xl bg-slate-950/40 p-4 ring-1 ring-white/5">
                                                <HealthRecordCard
                                                    record={record}
                                                    onEdit={handleEditRecord}
                                                    onDelete={handleDeleteRecord}
                                                    onToggleShare={handleToggleShare}
                                                />
                                                <div className="mt-4 flex justify-end">
                                                    <Button
                                                        variant="glassmorphism"
                                                        size="sm"
                                                        className="text-white"
                                                        onClick={() => handleShareRecord(record._id)}
                                                    >
                                                        <Share2 className="mr-2 h-4 w-4" />
                                                        {t('shareWithProviders')}
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <Card className="border-white/10 bg-white/[0.03] py-12 text-center backdrop-blur">
                                    <CardContent className="space-y-4">
                                        <div className="text-5xl">📁</div>
                                        <h3 className="text-2xl font-semibold">
                                            {searchQuery || selectedType ? t('noMatchingRecords') : t('noRecords')}
                                        </h3>
                                        <p className="mx-auto max-w-2xl text-sm text-white/70">
                                            {searchQuery || selectedType ? t('tryDifferentFilters') : t('createFirstRecord')}
                                        </p>
                                        {!searchQuery && !selectedType && (
                                            <Button onClick={() => setShowForm(true)} variant="gradient" animated>
                                                <FilePlus className="mr-2 h-4 w-4" />
                                                {t('addRecord')}
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            )}
                        </FadeIn>
                    </StaggerContainer>
                </div>
            </div>
        </div>
    );
}
