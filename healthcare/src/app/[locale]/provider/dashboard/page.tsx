'use client';

import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/navigation';
import { Link } from '@/navigation';
import { useState, useEffect } from 'react';
import { Users, Calendar, Clock, FileText } from 'lucide-react';
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

interface Consultation {
    _id: string;
    patientId: {
        _id: string;
        name: string;
        email: string;
    };
    type: string;
    scheduledFor: string;
    status: string;
    reason: string;
    notes?: string;
}

interface DashboardData {
    stats: {
        totalConsultations: number;
        completedConsultations: number;
        uniquePatientCount: number;
        todayConsultations: number;
    };
    upcomingConsultations: Consultation[];
    recentPatients: Patient[];
}

export default function ProviderDashboardPage() {
    const { data: session, status } = useSession();
    const t = useTranslations('ProviderDashboard');
    const router = useRouter();
    const [activeTab, setActiveTab] = useState('overview');
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Redirect if not logged in or not a provider
    useEffect(() => {
        if (status === 'unauthenticated') {
            router.push('/auth/signin');
        }

        if (session && session.user.role !== 'provider') {
            router.push('/dashboard');
        }
    }, [session, status, router]);

    // Fetch provider dashboard data
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                setLoading(true);
                const response = await fetch('/api/provider/dashboard');

                if (!response.ok) {
                    throw new Error(`Error: ${response.status}`);
                }

                const data = await response.json();
                setDashboardData(data);
            } catch (err) {
                console.error('Failed to fetch dashboard data:', err);
                setError('Failed to load dashboard data. Please try again later.');
            } finally {
                setLoading(false);
            }
        };

        if (session && session.user.role === 'provider') {
            fetchDashboardData();
        }
    }, [session]);

    // Rendering functions
    const renderLoading = () => (
        <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        </div>
    );

    const renderError = (errorMessage: string) => (
        <div className="bg-red-50 border-l-4 border-red-500 p-4 my-4">
            <div className="flex">
                <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                </div>
                <div className="ml-3">
                    <p className="text-sm text-red-700">{errorMessage}</p>
                </div>
            </div>
        </div>
    );

    if (status === 'loading') {
        return renderLoading();
    }

    if (!session) {
        return null; // Redirect will happen in the useEffect
    }

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="mb-8">
                <h1 className="text-3xl font-bold mb-2">{t('title')}</h1>
                <p className="text-gray-600">{t('subtitle')}</p>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-gray-200 mb-6">
                <nav className="flex -mb-px">
                    <button
                        onClick={() => setActiveTab('overview')}
                        className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === 'overview'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        {t('tabs.overview')}
                    </button>
                    <button
                        onClick={() => setActiveTab('consultations')}
                        className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === 'consultations'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        {t('tabs.consultations')}
                    </button>
                    <button
                        onClick={() => setActiveTab('patients')}
                        className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${activeTab === 'patients'
                                ? 'border-blue-500 text-blue-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            }`}
                    >
                        {t('tabs.patients')}
                    </button>
                </nav>
            </div>

            {loading ? (
                renderLoading()
            ) : error ? (
                renderError(error)
            ) : (
                <>
                    {/* Overview Tab */}
                    {activeTab === 'overview' && (
                        <div>
                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-sm font-medium">
                                            {t('stats.totalConsultations')}
                                        </CardTitle>
                                        <Calendar className="h-4 w-4 text-gray-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {dashboardData?.stats.totalConsultations || 0}
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            {t('stats.lifetimeConsultations')}
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-sm font-medium">
                                            {t('stats.completedConsultations')}
                                        </CardTitle>
                                        <FileText className="h-4 w-4 text-gray-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {dashboardData?.stats.completedConsultations || 0}
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            {t('stats.consultationsCompleted')}
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-sm font-medium">
                                            {t('stats.uniquePatients')}
                                        </CardTitle>
                                        <Users className="h-4 w-4 text-gray-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {dashboardData?.stats.uniquePatientCount || 0}
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            {t('stats.totalUniquePatients')}
                                        </p>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-sm font-medium">
                                            {t('stats.todayConsultations')}
                                        </CardTitle>
                                        <Clock className="h-4 w-4 text-gray-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {dashboardData?.stats.todayConsultations || 0}
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            {t('stats.scheduledForToday')}
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Upcoming Consultations */}
                            <h2 className="text-xl font-bold mb-4">{t('upcomingConsultations')}</h2>
                            <div className="bg-white shadow overflow-hidden sm:rounded-md mb-8">
                                <ul className="divide-y divide-gray-200">
                                    {dashboardData?.upcomingConsultations && dashboardData.upcomingConsultations.length > 0 ? (
                                        dashboardData.upcomingConsultations.map((consultation) => (
                                            <li key={consultation._id}>
                                                <div className="px-4 py-4 sm:px-6">
                                                    <div className="flex items-center justify-between">
                                                        <div className="flex items-center">
                                                            <div className="ml-3">
                                                                <p className="text-sm font-medium text-blue-600">
                                                                    {consultation.patientId.name}
                                                                </p>
                                                                <p className="text-sm text-gray-500">
                                                                    {consultation.reason}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        <div className="ml-2 flex-shrink-0 flex">
                                                            <p className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                                {consultation.status}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="mt-2 sm:flex sm:justify-between">
                                                        <div className="sm:flex">
                                                            <p className="flex items-center text-sm text-gray-500">
                                                                <Calendar className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                                                {new Date(consultation.scheduledFor).toLocaleDateString()}
                                                            </p>
                                                            <p className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0 sm:ml-6">
                                                                <Clock className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                                                                {new Date(consultation.scheduledFor).toLocaleTimeString()}
                                                            </p>
                                                        </div>
                                                        <div className="mt-2 sm:mt-0">
                                                            <Link href={`/consultations/room/${consultation._id}`} locale={undefined}>
                                                                <Button>{t('joinConsultation')}</Button>
                                                            </Link>
                                                        </div>
                                                    </div>
                                                </div>
                                            </li>
                                        ))
                                    ) : (
                                        <li className="px-4 py-4 sm:px-6 text-center text-gray-500">
                                            {t('noUpcomingConsultations')}
                                        </li>
                                    )}
                                </ul>
                            </div>

                            {/* Recent Patients */}
                            <h2 className="text-xl font-bold mb-4">{t('recentPatients')}</h2>
                            <div className="bg-white shadow overflow-hidden rounded-md">
                                <ul className="divide-y divide-gray-200">
                                    {dashboardData?.recentPatients && dashboardData.recentPatients.length > 0 ? (
                                        dashboardData.recentPatients.map((patient) => (
                                            <li key={patient.id} className="px-6 py-4 flex items-center">
                                                <div className="min-w-0 flex-1 flex items-center">
                                                    <div className="flex-shrink-0">
                                                        <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                                            {patient.profilePicture ? (
                                                                <Image
                                                                    src={patient.profilePicture}
                                                                    alt={patient.name}
                                                                    width={40}
                                                                    height={40}
                                                                    className="h-10 w-10 rounded-full object-cover"
                                                                    unoptimized
                                                                />
                                                            ) : (
                                                                patient.name.charAt(0).toUpperCase()
                                                            )}
                                                        </div>
                                                    </div>
                                                    <div className="min-w-0 flex-1 px-4">
                                                        <div>
                                                            <p className="text-sm font-medium text-blue-600 truncate">{patient.name}</p>
                                                            <p className="text-sm text-gray-500 truncate">{patient.email}</p>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div>
                                                    <Button variant="outline" size="sm">
                                                        {t('viewProfile')}
                                                    </Button>
                                                </div>
                                            </li>
                                        ))
                                    ) : (
                                        <li className="px-4 py-4 text-center text-gray-500">
                                            {t('noRecentPatients')}
                                        </li>
                                    )}
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Consultations Tab */}
                    {activeTab === 'consultations' && (
                        <div>
                            <div className="mb-6 flex justify-between items-center">
                                <h2 className="text-xl font-bold">{t('allConsultations')}</h2>
                                <Button className="bg-blue-600">
                                    {t('newConsultation')}
                                </Button>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                                <div className="flex flex-wrap gap-4 mb-4">
                                    <div className="flex-1 min-w-[200px]">
                                        <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                                            {t('filter.status')}
                                        </label>
                                        <select
                                            id="status-filter"
                                            className="px-4 py-2 border border-gray-300 rounded-md text-sm w-full"
                                            aria-label={t('filter.status')}
                                        >
                                            <option value="all">{t('filter.all')}</option>
                                            <option value="scheduled">{t('filter.scheduled')}</option>
                                            <option value="completed">{t('filter.completed')}</option>
                                            <option value="cancelled">{t('filter.cancelled')}</option>
                                        </select>
                                    </div>
                                    <div className="flex-1 min-w-[200px]">
                                        <label htmlFor="date-filter" className="block text-sm font-medium text-gray-700 mb-1">
                                            {t('filter.date')}
                                        </label>
                                        <select
                                            id="date-filter"
                                            className="px-4 py-2 border border-gray-300 rounded-md text-sm w-full"
                                            aria-label={t('filter.date')}
                                        >
                                            <option value="all">{t('filter.allDates')}</option>
                                            <option value="today">{t('filter.today')}</option>
                                            <option value="week">{t('filter.thisWeek')}</option>
                                            <option value="month">{t('filter.thisMonth')}</option>
                                        </select>
                                    </div>
                                    <div className="flex-1 min-w-[200px]">
                                        <label htmlFor="patient-search" className="block text-sm font-medium text-gray-700 mb-1">
                                            {t('filter.patient')}
                                        </label>
                                        <input
                                            id="patient-search"
                                            type="text"
                                            placeholder={t('filter.searchPatient')}
                                            className="px-4 py-2 border border-gray-300 rounded-md text-sm w-full"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white shadow overflow-hidden rounded-md">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {t('table.patient')}
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {t('table.date')}
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {t('table.time')}
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {t('table.type')}
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {t('table.status')}
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {t('table.actions')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {dashboardData?.upcomingConsultations && dashboardData.upcomingConsultations.length > 0 ? (
                                            dashboardData.upcomingConsultations.map((consultation) => (
                                                <tr key={consultation._id}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="ml-4">
                                                                <div className="text-sm font-medium text-gray-900">{consultation.patientId.name}</div>
                                                                <div className="text-sm text-gray-500">{consultation.patientId.email}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">{new Date(consultation.scheduledFor).toLocaleDateString()}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">{new Date(consultation.scheduledFor).toLocaleTimeString()}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">{consultation.type}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                            {consultation.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <Link href={`/consultations/room/${consultation._id}`} locale={undefined} className="text-blue-600 hover:text-blue-900">
                                                            {t('table.join')}
                                                        </Link>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={6} className="px-6 py-4 text-center text-gray-500">
                                                    {t('noConsultationsFound')}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Patients Tab */}
                    {activeTab === 'patients' && (
                        <div>
                            <div className="mb-6 flex justify-between items-center">
                                <h2 className="text-xl font-bold">{t('allPatients')}</h2>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                                <div className="flex flex-wrap gap-4 mb-4">
                                    <div className="flex-1 min-w-[300px]">
                                        <label htmlFor="patient-name-search" className="block text-sm font-medium text-gray-700 mb-1">
                                            {t('search.byName')}
                                        </label>
                                        <input
                                            id="patient-name-search"
                                            type="text"
                                            placeholder={t('search.enterPatientName')}
                                            className="px-4 py-2 border border-gray-300 rounded-md text-sm w-full"
                                        />
                                    </div>
                                    <div className="flex-1 min-w-[300px]">
                                        <label htmlFor="patient-email-search" className="block text-sm font-medium text-gray-700 mb-1">
                                            {t('search.byEmail')}
                                        </label>
                                        <input
                                            id="patient-email-search"
                                            type="text"
                                            placeholder={t('search.enterPatientEmail')}
                                            className="px-4 py-2 border border-gray-300 rounded-md text-sm w-full"
                                        />
                                    </div>
                                </div>
                                <div className="mt-4">
                                    <Button className="bg-blue-600">
                                        {t('search.searchButton')}
                                    </Button>
                                </div>
                            </div>

                            <div className="bg-white shadow overflow-hidden rounded-md">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {t('patientTable.name')}
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {t('patientTable.email')}
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {t('patientTable.lastConsultation')}
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {t('patientTable.totalConsultations')}
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {t('patientTable.actions')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {dashboardData?.recentPatients && dashboardData.recentPatients.length > 0 ? (
                                            dashboardData.recentPatients.map((patient) => (
                                                <tr key={patient.id}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="flex items-center">
                                                            <div className="flex-shrink-0 h-10 w-10">
                                                                <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-500">
                                                                    {patient.profilePicture ? (
                                                                        <Image
                                                                            src={patient.profilePicture}
                                                                            alt={patient.name}
                                                                            width={40}
                                                                            height={40}
                                                                            className="h-10 w-10 rounded-full object-cover"
                                                                            unoptimized
                                                                        />
                                                                    ) : (
                                                                        patient.name.charAt(0).toUpperCase()
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="ml-4">
                                                                <div className="text-sm font-medium text-gray-900">{patient.name}</div>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-500">{patient.email}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">N/A</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        N/A
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <button className="text-blue-600 hover:text-blue-900 mr-4">
                                                            {t('patientTable.viewProfile')}
                                                        </button>
                                                        <button className="text-green-600 hover:text-green-900">
                                                            {t('patientTable.newConsultation')}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                                                    {t('noPatientsFound')}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}
