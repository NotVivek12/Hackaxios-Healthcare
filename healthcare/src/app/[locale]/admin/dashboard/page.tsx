'use client';

import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { redirect } from 'next/navigation';
import { useState, useEffect } from 'react';
import {
    Users,
    Activity,
    Shield,
    Bell,
    Server,
    AlertTriangle,
    CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import HealthAnalyticsDashboard from '@/components/admin/health-analytics-dashboard';

// Type definitions for our data
interface User {
    _id: string;
    name: string;
    email: string;
    role: string;
    createdAt: string;
}

interface Consultation {
    _id: string;
    patientId: {
        _id: string;
        name: string;
        email: string;
    };
    providerId: {
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
    userStats: {
        total: number;
        patients: number;
        providers: number;
        admins: number;
        newToday: number;
    };
    consultationStats: {
        total: number;
        completed: number;
        scheduled: number;
        cancelled: number;
        scheduledToday: number;
    };
    symptomCheckStats: {
        total: number;
    };
    recentUsers: User[];
    recentConsultations: Consultation[];
}

export default function AdminDashboardPage() {
    const { data: session, status } = useSession();
    const t = useTranslations('AdminDashboard');
    const [activeTab, setActiveTab] = useState('overview');
    const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);

    // Mock system health metrics - would come from a real monitoring system in production
    const mockSystemHealth = {
        systemHealth: 98.5, // percentage
        serverUptime: '15d 8h 42m',
        databaseConnections: 32,
        averageResponseTime: '285ms',
        alertsThisWeek: 4
    };

    // Redirect if not logged in or not an admin
    useEffect(() => {
        if (status === 'unauthenticated') {
            redirect('/auth/signin');
        }

        if (session && session.user && session.user.role !== 'admin') {
            redirect('/dashboard');
        }
    }, [session, status]);

    // Fetch admin dashboard data
    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const response = await fetch('/api/admin/dashboard');

                if (!response.ok) {
                    throw new Error(`Error: ${response.status}`);
                }

                const data = await response.json();
                setDashboardData(data);
            } catch (err) {
                console.error('Failed to fetch dashboard data:', err);
            }
        };

        if (session && session.user && session.user.role === 'admin') {
            fetchDashboardData();
        }
    }, [session]);

    // Check if user is loading
    if (status === 'loading') {
        return <div className="flex justify-center items-center min-h-screen">{t('loading')}</div>;
    }

    if (!session) {
        return null; // Redirect will happen in the useEffect
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                {/* Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900">
                        {t('welcomeBack', { name: session.user?.name || 'Admin' })}
                    </h1>
                    <p className="text-lg text-gray-600 mt-2">
                        {t('dashboardOverview')}
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                {t('stats.totalUsers')}
                            </CardTitle>
                            <Users className="h-4 w-4 text-gray-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {dashboardData?.userStats.total || 0}
                            </div>
                            <p className="text-xs text-gray-500">
                                +{dashboardData?.userStats.newToday || 0} {t('stats.today')}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                {t('stats.totalProviders')}
                            </CardTitle>
                            <Shield className="h-4 w-4 text-gray-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {dashboardData?.userStats.providers || 0}
                            </div>
                            <p className="text-xs text-gray-500">
                                {t('stats.activeProviders')}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                {t('stats.totalConsultations')}
                            </CardTitle>
                            <Activity className="h-4 w-4 text-gray-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {dashboardData?.consultationStats.total || 0}
                            </div>
                            <p className="text-xs text-gray-500">
                                {dashboardData?.consultationStats.completed || 0} {t('stats.completed')}
                            </p>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-sm font-medium">
                                {t('stats.systemHealth')}
                            </CardTitle>
                            <Server className="h-4 w-4 text-gray-500" />
                        </CardHeader>
                        <CardContent>
                            <div className="text-2xl font-bold">
                                {mockSystemHealth.systemHealth}%
                            </div>
                            <p className="text-xs text-gray-500">
                                {mockSystemHealth.alertsThisWeek} {t('stats.alerts')}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* Tabs */}
                <div className="mb-6">
                    <div className="border-b border-gray-200">
                        <nav className="-mb-px flex space-x-8">
                            <button
                                onClick={() => setActiveTab('overview')}
                                className={`pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'overview'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                {t('tabs.overview')}
                            </button>
                            <button
                                onClick={() => setActiveTab('users')}
                                className={`pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'users'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                {t('tabs.users')}
                            </button>
                            <button
                                onClick={() => setActiveTab('analytics')}
                                className={`pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'analytics'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                {t('tabs.analytics')}
                            </button>
                            <button
                                onClick={() => setActiveTab('security')}
                                className={`pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'security'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                {t('tabs.security')}
                            </button>
                            <button
                                onClick={() => setActiveTab('settings')}
                                className={`pb-4 px-1 border-b-2 font-medium text-sm ${activeTab === 'settings'
                                    ? 'border-blue-500 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                            >
                                {t('tabs.settings')}
                            </button>
                        </nav>
                    </div>
                </div>

                {/* Tab Content */}
                <div className="mb-8">
                    {activeTab === 'overview' && (
                        <div>
                            {/* Stats Cards */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-sm font-medium">
                                            {t('stats.totalUsers')}
                                        </CardTitle>
                                        <Users className="h-4 w-4 text-gray-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {dashboardData?.userStats.total || 0}
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            +{dashboardData?.userStats.newToday || 0} {t('stats.today')}
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-sm font-medium">
                                            {t('stats.totalProviders')}
                                        </CardTitle>
                                        <Shield className="h-4 w-4 text-gray-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {dashboardData?.userStats.providers || 0}
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            {t('stats.activeProviders')}
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-sm font-medium">
                                            {t('stats.totalConsultations')}
                                        </CardTitle>
                                        <Activity className="h-4 w-4 text-gray-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {dashboardData?.consultationStats.total || 0}
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            {dashboardData?.consultationStats.completed || 0} {t('stats.completed')}
                                        </p>
                                    </CardContent>
                                </Card>

                                <Card>
                                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                                        <CardTitle className="text-sm font-medium">
                                            {t('stats.systemHealth')}
                                        </CardTitle>
                                        <Server className="h-4 w-4 text-gray-500" />
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {mockSystemHealth.systemHealth}%
                                        </div>
                                        <p className="text-xs text-gray-500">
                                            {mockSystemHealth.alertsThisWeek} {t('stats.alerts')}
                                        </p>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Recent Users */}
                            <h2 className="text-xl font-bold mb-4">{t('recentUsers')}</h2>
                            <div className="bg-white shadow overflow-hidden rounded-md mb-8">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {t('userTable.name')}
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {t('userTable.email')}
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {t('userTable.role')}
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {t('userTable.dateJoined')}
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {t('userTable.actions')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {dashboardData?.recentUsers && dashboardData.recentUsers.length > 0 ? (
                                            dashboardData.recentUsers.map((user) => (
                                                <tr key={user._id}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-500">{user.email}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                                                user.role === 'provider' ? 'bg-blue-100 text-blue-800' :
                                                                    'bg-green-100 text-green-800'}`}>
                                                            {user.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-500">
                                                            {new Date(user.createdAt).toLocaleDateString()}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <button className="text-blue-600 hover:text-blue-900">
                                                            {t('userTable.view')}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                                                    {t('noUsersFound')}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Recent Consultations */}
                            <h2 className="text-xl font-bold mb-4">{t('recentConsultations')}</h2>
                            <div className="bg-white shadow overflow-hidden rounded-md">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {t('consultationTable.patient')}
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {t('consultationTable.provider')}
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {t('consultationTable.date')}
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {t('consultationTable.status')}
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {t('consultationTable.actions')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {dashboardData?.recentConsultations && dashboardData.recentConsultations.length > 0 ? (
                                            dashboardData.recentConsultations.map((consultation) => (
                                                <tr key={consultation._id}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">{consultation.patientId.name}</div>
                                                        <div className="text-sm text-gray-500">{consultation.patientId.email}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">{consultation.providerId.name}</div>
                                                        <div className="text-sm text-gray-500">{consultation.providerId.email}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-900">
                                                            {new Date(consultation.scheduledFor).toLocaleDateString()}
                                                        </div>
                                                        <div className="text-sm text-gray-500">
                                                            {new Date(consultation.scheduledFor).toLocaleTimeString()}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${consultation.status === 'completed' ? 'bg-green-100 text-green-800' :
                                                                consultation.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                                                    'bg-yellow-100 text-yellow-800'}`}>
                                                            {consultation.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                                        <button className="text-blue-600 hover:text-blue-900">
                                                            {t('consultationTable.view')}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                                                    {t('noConsultationsFound')}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* Analytics Tab */}
                    {activeTab === 'analytics' && (
                        <div>
                            <HealthAnalyticsDashboard />
                        </div>
                    )}

                    {/* Users Tab */}
                    {activeTab === 'users' && (
                        <div>
                            <div className="mb-6 flex justify-between items-center">
                                <h2 className="text-xl font-bold">{t('tabs.users')}</h2>
                                <Button className="bg-blue-600">
                                    {t('addNewUser')}
                                </Button>
                            </div>

                            <div className="bg-white p-6 rounded-lg shadow-md mb-6">
                                <div className="flex flex-wrap gap-4 mb-4">
                                    <div className="flex-1 min-w-[200px]">
                                        <label htmlFor="role-filter" className="block text-sm font-medium text-gray-700 mb-1">
                                            {t('filter.role')}
                                        </label>
                                        <select
                                            id="role-filter"
                                            className="px-4 py-2 border border-gray-300 rounded-md text-sm w-full"
                                            aria-label={t('filter.role')}
                                        >
                                            <option value="all">{t('filter.all')}</option>
                                            <option value="admin">{t('filter.admin')}</option>
                                            <option value="provider">{t('filter.provider')}</option>
                                            <option value="patient">{t('filter.patient')}</option>
                                        </select>
                                    </div>
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
                                            <option value="active">{t('filter.active')}</option>
                                            <option value="inactive">{t('filter.inactive')}</option>
                                        </select>
                                    </div>
                                    <div className="flex-1 min-w-[300px]">
                                        <label htmlFor="user-search" className="block text-sm font-medium text-gray-700 mb-1">
                                            {t('search.users')}
                                        </label>
                                        <input
                                            id="user-search"
                                            type="text"
                                            placeholder={t('search.enterNameOrEmail')}
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

                            {/* User Stats Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">
                                            {t('stats.totalPatients')}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {dashboardData?.userStats.patients || 0}
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">
                                            {t('stats.totalProviders')}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {dashboardData?.userStats.providers || 0}
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-sm font-medium">
                                            {t('stats.totalAdmins')}
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="text-2xl font-bold">
                                            {dashboardData?.userStats.admins || 0}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>

                            {/* Users Table */}
                            <div className="bg-white shadow overflow-hidden rounded-md">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {t('userTable.name')}
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {t('userTable.email')}
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {t('userTable.role')}
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {t('userTable.dateJoined')}
                                            </th>
                                            <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                {t('userTable.actions')}
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {dashboardData?.recentUsers && dashboardData.recentUsers.length > 0 ? (
                                            dashboardData.recentUsers.map((user) => (
                                                <tr key={user._id}>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-500">{user.email}</div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                              ${user.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                                                                user.role === 'provider' ? 'bg-blue-100 text-blue-800' :
                                                                    'bg-green-100 text-green-800'}`}>
                                                            {user.role}
                                                        </span>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap">
                                                        <div className="text-sm text-gray-500">
                                                            {new Date(user.createdAt).toLocaleDateString()}
                                                        </div>
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                        <button className="text-blue-600 hover:text-blue-900 mr-4">
                                                            {t('userTable.edit')}
                                                        </button>
                                                        <button className="text-red-600 hover:text-red-900">
                                                            {t('userTable.delete')}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={5} className="px-6 py-4 text-center text-gray-500">
                                                    {t('noUsersFound')}
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    )}

                    {/* System Tab */}
                    {activeTab === 'system' && (
                        <div>
                            <div className="mb-8">
                                <h2 className="text-xl font-bold mb-4">{t('systemHealth')}</h2>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium">
                                                {t('system.healthScore')}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold text-green-600">
                                                {mockSystemHealth.systemHealth}%
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium">
                                                {t('system.uptime')}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">
                                                {mockSystemHealth.serverUptime}
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium">
                                                {t('system.responseTime')}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">
                                                {mockSystemHealth.averageResponseTime}
                                            </div>
                                        </CardContent>
                                    </Card>
                                    <Card>
                                        <CardHeader className="pb-2">
                                            <CardTitle className="text-sm font-medium">
                                                {t('system.dbConnections')}
                                            </CardTitle>
                                        </CardHeader>
                                        <CardContent>
                                            <div className="text-2xl font-bold">
                                                {mockSystemHealth.databaseConnections}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </div>
                            </div>

                            <div className="mb-8">
                                <h2 className="text-xl font-bold mb-4">{t('systemUtilization')}</h2>
                                <div className="bg-white p-6 rounded-lg shadow-md">
                                    <div className="mb-6">
                                        <div className="flex justify-between mb-1">
                                            <span className="text-sm font-medium text-gray-700">{t('system.cpu')}</span>
                                            <span className="text-sm text-gray-500">32%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                            <div className="bg-blue-600 h-2.5 rounded-full w-[32%]"></div>
                                        </div>
                                    </div>
                                    <div className="mb-6">
                                        <div className="flex justify-between mb-1">
                                            <span className="text-sm font-medium text-gray-700">{t('system.memory')}</span>
                                            <span className="text-sm text-gray-500">45%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                            <div className="bg-blue-600 h-2.5 rounded-full w-[45%]"></div>
                                        </div>
                                    </div>
                                    <div className="mb-6">
                                        <div className="flex justify-between mb-1">
                                            <span className="text-sm font-medium text-gray-700">{t('system.disk')}</span>
                                            <span className="text-sm text-gray-500">62%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                            <div className="bg-blue-600 h-2.5 rounded-full w-[62%]"></div>
                                        </div>
                                    </div>
                                    <div>
                                        <div className="flex justify-between mb-1">
                                            <span className="text-sm font-medium text-gray-700">{t('system.network')}</span>
                                            <span className="text-sm text-gray-500">18%</span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2.5">
                                            <div className="bg-blue-600 h-2.5 rounded-full w-[18%]"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <h2 className="text-xl font-bold mb-4">{t('recentAlerts')}</h2>
                                <div className="bg-white shadow overflow-hidden rounded-md">
                                    <ul className="divide-y divide-gray-200">
                                        <li className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0">
                                                    <span className="h-8 w-8 rounded-full bg-yellow-100 flex items-center justify-center">
                                                        <AlertTriangle className="h-5 w-5 text-yellow-600" />
                                                    </span>
                                                </div>
                                                <div className="ml-4">
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {t('alerts.highServerLoad')}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {t('alerts.highServerLoadDesc')}
                                                    </p>
                                                </div>
                                                <div className="ml-auto">
                                                    <p className="text-sm text-gray-500">
                                                        {new Date(Date.now() - 3600000).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </li>
                                        <li className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0">
                                                    <span className="h-8 w-8 rounded-full bg-green-100 flex items-center justify-center">
                                                        <CheckCircle className="h-5 w-5 text-green-600" />
                                                    </span>
                                                </div>
                                                <div className="ml-4">
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {t('alerts.backupCompleted')}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {t('alerts.backupCompletedDesc')}
                                                    </p>
                                                </div>
                                                <div className="ml-auto">
                                                    <p className="text-sm text-gray-500">
                                                        {new Date(Date.now() - 7200000).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </li>
                                        <li className="px-6 py-4">
                                            <div className="flex items-center">
                                                <div className="flex-shrink-0">
                                                    <span className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
                                                        <Bell className="h-5 w-5 text-blue-600" />
                                                    </span>
                                                </div>
                                                <div className="ml-4">
                                                    <p className="text-sm font-medium text-gray-900">
                                                        {t('alerts.systemUpdate')}
                                                    </p>
                                                    <p className="text-sm text-gray-500">
                                                        {t('alerts.systemUpdateDesc')}
                                                    </p>
                                                </div>
                                                <div className="ml-auto">
                                                    <p className="text-sm text-gray-500">
                                                        {new Date(Date.now() - 86400000).toLocaleString()}
                                                    </p>
                                                </div>
                                            </div>
                                        </li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Settings Tab */}
                    {activeTab === 'settings' && (
                        <div>
                            <div className="mb-8">
                                <h2 className="text-xl font-bold mb-4">{t('systemSettings')}</h2>
                                <div className="bg-white shadow rounded-md p-6">
                                    <div className="border-b border-gray-200 pb-6 mb-6">
                                        <h3 className="text-lg font-medium mb-4">{t('settings.general')}</h3>

                                        <div className="mb-4">
                                            <label htmlFor="site-name" className="block text-sm font-medium text-gray-700 mb-1">
                                                {t('settings.siteName')}
                                            </label>
                                            <input
                                                type="text"
                                                id="site-name"
                                                className="px-4 py-2 border border-gray-300 rounded-md w-full max-w-md"
                                                defaultValue="AI Healthcare Platform"
                                            />
                                        </div>

                                        <div className="mb-4">
                                            <label htmlFor="admin-email" className="block text-sm font-medium text-gray-700 mb-1">
                                                {t('settings.adminEmail')}
                                            </label>
                                            <input
                                                type="email"
                                                id="admin-email"
                                                className="px-4 py-2 border border-gray-300 rounded-md w-full max-w-md"
                                                defaultValue="admin@aihealthcare.com"
                                            />
                                        </div>

                                        <div>
                                            <label htmlFor="default-language" className="block text-sm font-medium text-gray-700 mb-1">
                                                {t('settings.defaultLanguage')}
                                            </label>
                                            <select
                                                id="default-language"
                                                className="px-4 py-2 border border-gray-300 rounded-md w-full max-w-md"
                                                defaultValue="en"
                                                aria-label={t('settings.defaultLanguage')}
                                            >
                                                <option value="en">English</option>
                                                <option value="es">Español</option>
                                                <option value="fr">Français</option>
                                                <option value="ar">العربية</option>
                                                <option value="pt">Português</option>
                                                <option value="hi">हिन्दी</option>
                                                <option value="sw">Kiswahili</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="border-b border-gray-200 pb-6 mb-6">
                                        <h3 className="text-lg font-medium mb-4">{t('settings.security')}</h3>

                                        <div className="mb-4 flex items-center">
                                            <input
                                                type="checkbox"
                                                id="two-factor"
                                                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                                defaultChecked
                                            />
                                            <label htmlFor="two-factor" className="ml-2 block text-sm text-gray-700">
                                                {t('settings.requireTwoFactor')}
                                            </label>
                                        </div>

                                        <div className="mb-4 flex items-center">
                                            <input
                                                type="checkbox"
                                                id="password-complexity"
                                                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                                defaultChecked
                                            />
                                            <label htmlFor="password-complexity" className="ml-2 block text-sm text-gray-700">
                                                {t('settings.enforcePasswordComplexity')}
                                            </label>
                                        </div>

                                        <div className="mb-4">
                                            <label htmlFor="session-timeout" className="block text-sm font-medium text-gray-700 mb-1">
                                                {t('settings.sessionTimeout')}
                                            </label>
                                            <select
                                                id="session-timeout"
                                                className="px-4 py-2 border border-gray-300 rounded-md w-full max-w-md"
                                                defaultValue="30"
                                                aria-label={t('settings.sessionTimeout')}
                                            >
                                                <option value="15">15 {t('settings.minutes')}</option>
                                                <option value="30">30 {t('settings.minutes')}</option>
                                                <option value="60">60 {t('settings.minutes')}</option>
                                                <option value="120">2 {t('settings.hours')}</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div>
                                        <h3 className="text-lg font-medium mb-4">{t('settings.maintenance')}</h3>

                                        <div className="mb-4 flex items-center">
                                            <input
                                                type="checkbox"
                                                id="maintenance-mode"
                                                className="h-4 w-4 text-blue-600 border-gray-300 rounded"
                                            />
                                            <label htmlFor="maintenance-mode" className="ml-2 block text-sm text-gray-700">
                                                {t('settings.enableMaintenanceMode')}
                                            </label>
                                        </div>

                                        <div className="mb-6">
                                            <label htmlFor="maintenance-message" className="block text-sm font-medium text-gray-700 mb-1">
                                                {t('settings.maintenanceMessage')}
                                            </label>
                                            <textarea
                                                id="maintenance-message"
                                                rows={3}
                                                className="px-4 py-2 border border-gray-300 rounded-md w-full"
                                                defaultValue="The system is currently undergoing scheduled maintenance. Please check back soon."
                                            ></textarea>
                                        </div>

                                        <div className="flex justify-end">
                                            <Button className="bg-blue-600">
                                                {t('settings.saveChanges')}
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* System Status */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('systemStatus')}</CardTitle>
                        <CardDescription>{t('currentSystemStatus')}</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                            <div className="p-4 bg-green-50 rounded-lg">
                                <p className="text-sm font-medium text-green-800 mb-1">
                                    {t('status.apiHealth')}
                                </p>
                                <div className="flex items-center">
                                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                                    <p className="text-sm text-green-700">{t('status.operational')}</p>
                                </div>
                            </div>

                            <div className="p-4 bg-green-50 rounded-lg">
                                <p className="text-sm font-medium text-green-800 mb-1">
                                    {t('status.databaseHealth')}
                                </p>
                                <div className="flex items-center">
                                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                                    <p className="text-sm text-green-700">{t('status.operational')}</p>
                                </div>
                            </div>

                            <div className="p-4 bg-green-50 rounded-lg">
                                <p className="text-sm font-medium text-green-800 mb-1">
                                    {t('status.storageSystems')}
                                </p>
                                <div className="flex items-center">
                                    <div className="w-3 h-3 rounded-full bg-green-500 mr-2"></div>
                                    <p className="text-sm text-green-700">{t('status.operational')}</p>
                                </div>
                            </div>

                            <div className="p-4 bg-yellow-50 rounded-lg">
                                <p className="text-sm font-medium text-yellow-800 mb-1">
                                    {t('status.aiServices')}
                                </p>
                                <div className="flex items-center">
                                    <div className="w-3 h-3 rounded-full bg-yellow-500 mr-2"></div>
                                    <p className="text-sm text-yellow-700">{t('status.degradedPerformance')}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
