'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    Search,
    UserPlus,
    UserCheck,
    UserX,
    CheckCircle,
    AlertCircle,
    RefreshCw,
    ArrowLeft
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface Patient {
    id: string;
    name: string;
    email: string;
    providerId?: string;
    providerName?: string;
    lastConsultation?: string;
    healthConditions?: string[];
    assignmentStatus: 'assigned' | 'unassigned' | 'requested';
}

interface Provider {
    id: string;
    name: string;
    specialty: string;
    patientCount: number;
    availability: string;
    imageUrl: string;
}

type AssignmentFilter = 'all' | 'assigned' | 'unassigned';

export default function ProviderAssignmentPage() {
    const { data: session } = useSession({
        required: true,
        onUnauthenticated() {
            redirect('/auth/signin');
        }
    });

    const t = useTranslations('Admin');
    const [patients, setPatients] = useState<Patient[]>([]);
    const [providers, setProviders] = useState<Provider[]>([]);
    const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [isProviderModalOpen, setIsProviderModalOpen] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);
    const [loading, setLoading] = useState(true);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [filter, setFilter] = useState<AssignmentFilter>('all');

    // Sample data for demonstration
    useEffect(() => {
        // This would be replaced with API calls in a real implementation
        const mockPatients: Patient[] = [
            {
                id: '1',
                name: 'John Smith',
                email: 'john.smith@example.com',
                providerId: '1',
                providerName: 'Dr. Sarah Johnson',
                lastConsultation: '2025-06-30',
                healthConditions: ['Hypertension', 'Diabetes'],
                assignmentStatus: 'assigned'
            },
            {
                id: '2',
                name: 'Emily Jones',
                email: 'emily.jones@example.com',
                providerId: '3',
                providerName: 'Dr. Amara Okafor',
                lastConsultation: '2025-07-05',
                healthConditions: ['Asthma'],
                assignmentStatus: 'assigned'
            },
            {
                id: '3',
                name: 'Michael Chen',
                email: 'michael.chen@example.com',
                assignmentStatus: 'unassigned'
            },
            {
                id: '4',
                name: 'Sofia Rodriguez',
                email: 'sofia.rodriguez@example.com',
                assignmentStatus: 'requested'
            },
            {
                id: '5',
                name: 'David Kim',
                email: 'david.kim@example.com',
                providerId: '4',
                providerName: 'Dr. James Rodriguez',
                lastConsultation: '2025-07-01',
                healthConditions: ['Arthritis'],
                assignmentStatus: 'assigned'
            }
        ];

        const mockProviders: Provider[] = [
            {
                id: '1',
                name: 'Dr. Sarah Johnson',
                specialty: 'Cardiology',
                patientCount: 24,
                availability: 'High',
                imageUrl: 'https://randomuser.me/api/portraits/women/44.jpg'
            },
            {
                id: '2',
                name: 'Dr. Michael Chen',
                specialty: 'Pediatrics',
                patientCount: 18,
                availability: 'Medium',
                imageUrl: 'https://randomuser.me/api/portraits/men/35.jpg'
            },
            {
                id: '3',
                name: 'Dr. Amara Okafor',
                specialty: 'Neurology',
                patientCount: 15,
                availability: 'Low',
                imageUrl: 'https://randomuser.me/api/portraits/women/22.jpg'
            },
            {
                id: '4',
                name: 'Dr. James Rodriguez',
                specialty: 'Family Medicine',
                patientCount: 30,
                availability: 'Medium',
                imageUrl: 'https://randomuser.me/api/portraits/men/41.jpg'
            },
            {
                id: '5',
                name: 'Dr. Ayesha Patel',
                specialty: 'Dermatology',
                patientCount: 12,
                availability: 'High',
                imageUrl: 'https://randomuser.me/api/portraits/women/59.jpg'
            }
        ];

        setPatients(mockPatients);
        setProviders(mockProviders);
        setLoading(false);
    }, []);

    // Filter patients based on search and filter
    const filteredPatients = patients.filter(patient => {
        const matchesSearch = patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            patient.email.toLowerCase().includes(searchTerm.toLowerCase());

        if (filter === 'all') return matchesSearch;
        if (filter === 'assigned') return matchesSearch && patient.assignmentStatus === 'assigned';
        if (filter === 'unassigned') return matchesSearch && (patient.assignmentStatus === 'unassigned' || patient.assignmentStatus === 'requested');

        return matchesSearch;
    });

    // Handle provider assignment
    const handleAssignProvider = async () => {
        if (!selectedPatient || !selectedProvider) return;

        setLoading(true);

        try {
            // In a real implementation, this would be an API call
            // For demo purposes, we'll update the state directly

            const updatedPatients = patients.map(patient => {
                if (patient.id === selectedPatient.id) {
                    return {
                        ...patient,
                        providerId: selectedProvider.id,
                        providerName: selectedProvider.name,
                        assignmentStatus: 'assigned' as const
                    };
                }
                return patient;
            });

            // Update providers (increase patient count)
            const updatedProviders = providers.map(provider => {
                if (provider.id === selectedProvider.id) {
                    return {
                        ...provider,
                        patientCount: provider.patientCount + 1
                    };
                }
                // If patient had a previous provider, decrease their count
                if (selectedPatient.providerId && provider.id === selectedPatient.providerId) {
                    return {
                        ...provider,
                        patientCount: Math.max(0, provider.patientCount - 1)
                    };
                }
                return provider;
            });

            setPatients(updatedPatients);
            setProviders(updatedProviders);
            setSuccessMessage(`${selectedProvider.name} has been assigned to ${selectedPatient.name}`);

            // Reset selection
            setIsProviderModalOpen(false);
            setSelectedProvider(null);

            // Clear success message after 3 seconds
            setTimeout(() => {
                setSuccessMessage('');
            }, 3000);
        } catch (error) {
            console.error('Error assigning provider:', error);
            setErrorMessage('Failed to assign provider. Please try again.');

            // Clear error message after 3 seconds
            setTimeout(() => {
                setErrorMessage('');
            }, 3000);
        } finally {
            setLoading(false);
        }
    };

    // Handle removing a provider
    const handleRemoveProvider = async (patient: Patient) => {
        if (!patient.providerId) return;

        setLoading(true);

        try {
            // In a real implementation, this would be an API call
            const updatedPatients = patients.map(p => {
                if (p.id === patient.id) {
                    return {
                        ...p,
                        providerId: undefined,
                        providerName: undefined,
                        assignmentStatus: 'unassigned' as const
                    };
                }
                return p;
            });

            // Update providers (decrease patient count)
            const updatedProviders = providers.map(provider => {
                if (provider.id === patient.providerId) {
                    return {
                        ...provider,
                        patientCount: Math.max(0, provider.patientCount - 1)
                    };
                }
                return provider;
            });

            setPatients(updatedPatients);
            setProviders(updatedProviders);
            setSuccessMessage(`Provider has been removed from ${patient.name}`);

            // Clear success message after 3 seconds
            setTimeout(() => {
                setSuccessMessage('');
            }, 3000);
        } catch (error) {
            console.error('Error removing provider:', error);
            setErrorMessage('Failed to remove provider. Please try again.');

            // Clear error message after 3 seconds
            setTimeout(() => {
                setErrorMessage('');
            }, 3000);
        } finally {
            setLoading(false);
        }
    };

    // Access check - should be admin
    if (session?.user?.role !== 'admin') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Card>
                    <CardHeader>
                        <CardTitle>{t('accessDenied')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p>{t('adminAccessRequired')}</p>
                    </CardContent>
                    <CardFooter>
                        <Button onClick={() => window.history.back()}>
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            {t('goBack')}
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white dark:from-gray-900 dark:to-gray-800">
            <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
                {/* Page Header */}
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-white">{t('providerAssignment')}</h1>
                    <p className="mt-2 text-lg text-gray-600 dark:text-gray-400">{t('manageProviderPatientRelationships')}</p>
                </div>

                {/* Success/Error Messages */}
                {successMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg flex items-center"
                    >
                        <CheckCircle className="h-5 w-5 text-green-500 mr-2" />
                        <span className="text-green-800 dark:text-green-300">{successMessage}</span>
                    </motion.div>
                )}

                {errorMessage && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg flex items-center"
                    >
                        <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
                        <span className="text-red-800 dark:text-red-300">{errorMessage}</span>
                    </motion.div>
                )}

                {/* Search and Filter Section */}
                <Card className="mb-6">
                    <CardContent className="pt-6">
                        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                            <div className="relative flex-grow">
                                <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                <Input
                                    type="text"
                                    placeholder={t('searchPatients')}
                                    className="pl-10"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                />
                            </div>
                            <div className="flex space-x-2">
                                <select
                                    className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2"
                                    value={filter}
                                    onChange={(e) => setFilter(e.target.value as AssignmentFilter)}
                                >
                                    <option value="all">{t('allPatients')}</option>
                                    <option value="assigned">{t('assignedPatients')}</option>
                                    <option value="unassigned">{t('unassignedPatients')}</option>
                                </select>
                                <Button
                                    variant="outline"
                                    className="gap-1"
                                    onClick={() => {
                                        setSearchTerm('');
                                        setFilter('all');
                                    }}
                                >
                                    <RefreshCw className="h-4 w-4" />
                                    {t('reset')}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Patient List Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>{t('patients')}</CardTitle>
                        <CardDescription>
                            {t('totalPatients')}: {patients.length} | {t('assigned')}: {patients.filter(p => p.assignmentStatus === 'assigned').length} | {t('unassigned')}: {patients.filter(p => p.assignmentStatus !== 'assigned').length}
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? (
                            <div className="flex justify-center py-8">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                            </div>
                        ) : filteredPatients.length === 0 ? (
                            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                                {t('noPatients')}
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b dark:border-gray-700">
                                            <th className="px-4 py-3 text-left">{t('patientName')}</th>
                                            <th className="px-4 py-3 text-left">{t('email')}</th>
                                            <th className="px-4 py-3 text-left">{t('assignedProvider')}</th>
                                            <th className="px-4 py-3 text-left">{t('status')}</th>
                                            <th className="px-4 py-3 text-right">{t('actions')}</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {filteredPatients.map(patient => (
                                            <tr key={patient.id} className="border-b dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
                                                <td className="px-4 py-4">{patient.name}</td>
                                                <td className="px-4 py-4">{patient.email}</td>
                                                <td className="px-4 py-4">
                                                    {patient.providerName || (
                                                        <span className="text-gray-400">{t('noProvider')}</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4">
                                                    {patient.assignmentStatus === 'assigned' && (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                                            <UserCheck className="h-3 w-3 mr-1" />
                                                            {t('assigned')}
                                                        </span>
                                                    )}
                                                    {patient.assignmentStatus === 'unassigned' && (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200">
                                                            <UserX className="h-3 w-3 mr-1" />
                                                            {t('unassigned')}
                                                        </span>
                                                    )}
                                                    {patient.assignmentStatus === 'requested' && (
                                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
                                                            <AlertCircle className="h-3 w-3 mr-1" />
                                                            {t('requested')}
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-4 text-right">
                                                    {patient.assignmentStatus === 'assigned' ? (
                                                        <div className="flex justify-end space-x-2">
                                                            <Button
                                                                variant="outline"
                                                                size="sm"
                                                                onClick={() => {
                                                                    setSelectedPatient(patient);
                                                                    setIsProviderModalOpen(true);
                                                                }}
                                                            >
                                                                {t('changeProvider')}
                                                            </Button>
                                                            <Button
                                                                variant="destructive"
                                                                size="sm"
                                                                onClick={() => handleRemoveProvider(patient)}
                                                            >
                                                                {t('removeProvider')}
                                                            </Button>
                                                        </div>
                                                    ) : (
                                                        <Button
                                                            variant="default"
                                                            size="sm"
                                                            onClick={() => {
                                                                setSelectedPatient(patient);
                                                                setIsProviderModalOpen(true);
                                                            }}
                                                        >
                                                            <UserPlus className="h-4 w-4 mr-1" />
                                                            {t('assignProvider')}
                                                        </Button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Provider Assignment Modal */}
                {isProviderModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <motion.div
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-2xl font-bold">
                                        {selectedPatient?.providerId ? t('changeProvider') : t('assignProvider')}
                                    </h2>
                                    <button
                                        className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700"
                                        onClick={() => setIsProviderModalOpen(false)}
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                        </svg>
                                    </button>
                                </div>

                                <p className="mb-4">
                                    {t('selectProviderFor')} <span className="font-semibold">{selectedPatient?.name}</span>
                                </p>

                                <div className="mb-4 relative">
                                    <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                                    <Input
                                        type="text"
                                        placeholder={t('searchProviders')}
                                        className="pl-10"
                                        onChange={() => {
                                            // In a real app, this would filter providers from the API
                                            // For demo, we'll keep it simple
                                        }}
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                    {providers.map(provider => (
                                        <div
                                            key={provider.id}
                                            className={`
                        p-4 rounded-lg border cursor-pointer transition-all flex items-center
                        ${selectedProvider?.id === provider.id
                                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/30'
                                                    : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'}
                      `}
                                            onClick={() => setSelectedProvider(provider)}
                                        >
                                            <Image
                                                src={provider.imageUrl}
                                                alt={provider.name}
                                                width={64}
                                                height={64}
                                                unoptimized
                                                className="h-16 w-16 rounded-full object-cover border-2 border-gray-200"
                                            />
                                            <div className="ml-4 flex-1">
                                                <h3 className="font-medium">{provider.name}</h3>
                                                <p className="text-sm text-blue-600 dark:text-blue-400">{provider.specialty}</p>
                                                <div className="flex items-center mt-1 text-sm text-gray-600 dark:text-gray-400">
                                                    <span className="mr-2">{t('patients')}: {provider.patientCount}</span>
                                                    <span>
                                                        {t('availability')}:
                                                        <span className={`ml-1 ${provider.availability === 'High' ? 'text-green-600 dark:text-green-400' :
                                                                provider.availability === 'Medium' ? 'text-yellow-600 dark:text-yellow-400' :
                                                                    'text-red-600 dark:text-red-400'
                                                            }`}>
                                                            {provider.availability}
                                                        </span>
                                                    </span>
                                                </div>
                                            </div>
                                            {selectedProvider?.id === provider.id && (
                                                <div className="ml-2 h-5 w-5 text-blue-600 dark:text-blue-400">
                                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                    </svg>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-end space-x-3">
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsProviderModalOpen(false)}
                                    >
                                        {t('cancel')}
                                    </Button>
                                    <Button
                                        disabled={!selectedProvider || loading}
                                        onClick={handleAssignProvider}
                                    >
                                        {loading ? (
                                            <>
                                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                                {t('assigning')}
                                            </>
                                        ) : (
                                            t('confirmAssignment')
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </div>
        </div>
    );
}
