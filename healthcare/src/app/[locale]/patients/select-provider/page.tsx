'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useSession } from 'next-auth/react';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/navigation';
import { redirect } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search,
    Star,
    Filter,
    ChevronDown,
    CheckCircle,
    AlertCircle,
    Briefcase,
    MapPin,
    Calendar,
    ArrowRight,
    Heart
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Types for our provider data (same as the main provider page)
interface Provider {
    id: string;
    name: string;
    specialty: string;
    rating: number;
    reviewCount: number;
    yearsExperience: number;
    location: string;
    imageUrl: string;
    languages: string[];
    about: string;
}

export default function SelectProviderPage() {
    const { status } = useSession({
        required: true,
        onUnauthenticated() {
            redirect('/auth/signin');
        }
    });

    const t = useTranslations('Patients');
    const router = useRouter();
    const [providers, setProviders] = useState<Provider[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [currentProvider, setCurrentProvider] = useState<Provider | null>(null);
    const [loading, setLoading] = useState(true);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [confirmationModalOpen, setConfirmationModalOpen] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);

    // List of specialties derived from providers
    const specialties = providers.length > 0
        ? Array.from(new Set(providers.map(p => p.specialty)))
        : [];

    // Sample data for demonstration
    useEffect(() => {
        const fetchData = async () => {
            setLoading(true);
            try {
                // In a real implementation, this would be API calls to get:
                // 1. The user's current provider
                // 2. Available providers for selection

                // Mock data for providers
                const mockProviders: Provider[] = [
                    {
                        id: '1',
                        name: 'Dr. Sarah Johnson',
                        specialty: 'Cardiology',
                        rating: 4.9,
                        reviewCount: 127,
                        yearsExperience: 12,
                        location: 'New York, NY',
                        imageUrl: 'https://randomuser.me/api/portraits/women/44.jpg',
                        languages: ['English', 'Spanish'],
                        about: 'Specialist in cardiovascular health with over 12 years of experience in treating heart conditions and preventative care.'
                    },
                    {
                        id: '2',
                        name: 'Dr. Michael Chen',
                        specialty: 'Pediatrics',
                        rating: 4.8,
                        reviewCount: 98,
                        yearsExperience: 8,
                        location: 'San Francisco, CA',
                        imageUrl: 'https://randomuser.me/api/portraits/men/35.jpg',
                        languages: ['English', 'Mandarin'],
                        about: 'Pediatrician dedicated to providing comprehensive healthcare for children from infancy through adolescence.'
                    },
                    {
                        id: '3',
                        name: 'Dr. Amara Okafor',
                        specialty: 'Neurology',
                        rating: 4.7,
                        reviewCount: 85,
                        yearsExperience: 10,
                        location: 'Boston, MA',
                        imageUrl: 'https://randomuser.me/api/portraits/women/22.jpg',
                        languages: ['English', 'French', 'Yoruba'],
                        about: 'Neurologist specializing in headache disorders, stroke care, and neurodegenerative diseases.'
                    },
                    {
                        id: '4',
                        name: 'Dr. James Rodriguez',
                        specialty: 'Family Medicine',
                        rating: 4.9,
                        reviewCount: 142,
                        yearsExperience: 15,
                        location: 'Miami, FL',
                        imageUrl: 'https://randomuser.me/api/portraits/men/41.jpg',
                        languages: ['English', 'Spanish'],
                        about: 'Family physician providing comprehensive care for patients of all ages, with a focus on preventative health.'
                    },
                    {
                        id: '5',
                        name: 'Dr. Ayesha Patel',
                        specialty: 'Dermatology',
                        rating: 4.8,
                        reviewCount: 112,
                        yearsExperience: 9,
                        location: 'Chicago, IL',
                        imageUrl: 'https://randomuser.me/api/portraits/women/59.jpg',
                        languages: ['English', 'Hindi', 'Gujarati'],
                        about: 'Board-certified dermatologist specializing in medical, surgical, and cosmetic dermatology.'
                    }
                ];

                // Mock current provider (might be null for new patients)
                const mockCurrentProvider = mockProviders[3]; // For demo purposes

                setProviders(mockProviders);
                setCurrentProvider(mockCurrentProvider);
            } catch (error) {
                console.error('Error fetching data:', error);
                setErrorMessage(t('errorFetchingProviders'));
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [t]);

    // Filter providers based on search term and specialty
    const filteredProviders = providers.filter(provider => {
        const matchesSearch = provider.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            provider.specialty.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesSpecialty = !selectedSpecialty || provider.specialty === selectedSpecialty;

        return matchesSearch && matchesSpecialty;
    });

    // Handle provider selection
    const handleSelectProvider = async () => {
        if (!selectedProvider) return;

        setLoading(true);

        try {
            // In a real implementation, this would be an API call to update the user's provider

            // For demo purposes, just update the state
            setCurrentProvider(selectedProvider);
            setSuccessMessage(`${selectedProvider.name} is now your primary care provider`);
            setConfirmationModalOpen(false);

            // Clear success message after 3 seconds
            setTimeout(() => {
                setSuccessMessage('');
            }, 3000);
        } catch (error) {
            console.error('Failed to update provider selection:', error);
            setErrorMessage('Failed to update your provider. Please try again.');

            // Clear error message after 3 seconds
            setTimeout(() => {
                setErrorMessage('');
            }, 3000);
        } finally {
            setLoading(false);
        }
    };

    // If session is loading, show loading state
    if (status === 'loading') {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
            <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
                {/* Page Header */}
                <div className="text-center mb-12">
                    <motion.h1
                        className="text-4xl font-bold text-gray-900 dark:text-white mb-4"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        {t('selectYourProvider')}
                    </motion.h1>
                    <motion.p
                        className="text-xl text-gray-600 dark:text-gray-300"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        {t('selectProviderSubtitle')}
                    </motion.p>
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

                {/* Current Provider Section */}
                {currentProvider && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.2 }}
                        className="mb-8"
                    >
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">{t('yourCurrentProvider')}</h2>
                        <Card className="bg-white dark:bg-gray-800 shadow-md overflow-hidden hover:shadow-lg transition-shadow">
                            <CardContent className="p-6">
                                <div className="md:flex">
                                    <div className="md:flex-shrink-0 mb-4 md:mb-0 md:mr-6">
                                        <Image
                                            src={currentProvider.imageUrl}
                                            alt={currentProvider.name}
                                            width={128}
                                            height={128}
                                            className="h-32 w-32 rounded-full object-cover border-4 border-blue-100 mx-auto md:mx-0"
                                            unoptimized
                                        />
                                    </div>
                                    <div className="md:flex-1">
                                        <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                                            <div>
                                                <h2 className="text-xl font-bold text-gray-900 dark:text-white text-center md:text-left">{currentProvider.name}</h2>
                                                <p className="text-blue-600 dark:text-blue-400 font-medium text-center md:text-left">{currentProvider.specialty}</p>
                                                <div className="flex items-center mt-1 justify-center md:justify-start">
                                                    <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                                    <span className="ml-1 text-gray-700 dark:text-gray-300">{currentProvider.rating} ({currentProvider.reviewCount} {t('reviews')})</span>
                                                </div>
                                                <div className="mt-2 flex items-center text-gray-600 dark:text-gray-400 justify-center md:justify-start">
                                                    <Briefcase className="h-4 w-4 mr-1" />
                                                    <span>{currentProvider.yearsExperience} {t('yearsExperience')}</span>
                                                </div>
                                                <div className="mt-1 flex items-center text-gray-600 dark:text-gray-400 justify-center md:justify-start">
                                                    <MapPin className="h-4 w-4 mr-1" />
                                                    <span>{currentProvider.location}</span>
                                                </div>
                                            </div>

                                            <div className="mt-4 md:mt-0 flex flex-col md:items-end space-y-2">
                                                <Button
                                                    variant="gradient"
                                                    className="rounded-full"
                                                    onClick={() => router.push(`/consultations/new?providerId=${currentProvider.id}`)}
                                                >
                                                    <Calendar className="h-4 w-4 mr-1" />
                                                    {t('bookAppointment')}
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    className="rounded-full"
                                                    onClick={() => router.push(`/provider?id=${currentProvider.id}`)}
                                                >
                                                    {t('viewFullProfile')}
                                                    <ArrowRight className="ml-1 h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                )}

                {/* Search and Filter Section */}
                <motion.div
                    className="mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.3 }}
                >
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
                        {currentProvider ? t('changeYourProvider') : t('selectAProvider')}
                    </h2>

                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="relative flex-grow">
                            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            <Input
                                type="text"
                                placeholder={t('searchProvidersPlaceholder')}
                                className="pl-10 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex items-center space-x-2">
                            <Button
                                variant="outline"
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex items-center gap-2"
                            >
                                <Filter className="h-4 w-4" />
                                {t('filters')}
                                <ChevronDown className={`h-4 w-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
                            </Button>
                        </div>
                    </div>

                    {/* Filters */}
                    <AnimatePresence>
                        {showFilters && (
                            <motion.div
                                className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4"
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                            >
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                        {t('specialty')}
                                    </label>
                                    <select
                                        className="w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700"
                                        value={selectedSpecialty || ''}
                                        onChange={(e) => setSelectedSpecialty(e.target.value || null)}
                                    >
                                        <option value="">{t('allSpecialties')}</option>
                                        {specialties.map(specialty => (
                                            <option key={specialty} value={specialty}>{specialty}</option>
                                        ))}
                                    </select>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </motion.div>

                {/* Provider Listing */}
                <div className="space-y-6">
                    {loading ? (
                        <div className="flex justify-center py-12">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
                        </div>
                    ) : filteredProviders.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="mb-4">
                                <Search className="h-12 w-12 mx-auto text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('noProvidersFound')}</h3>
                            <p className="mt-1 text-gray-500 dark:text-gray-400">{t('tryAdjustingFilters')}</p>
                        </div>
                    ) : (
                        filteredProviders.map((provider, index) => (
                            <ProviderCard
                                key={provider.id}
                                provider={provider}
                                isCurrentProvider={currentProvider?.id === provider.id}
                                onSelect={() => {
                                    setSelectedProvider(provider);
                                    setConfirmationModalOpen(true);
                                }}
                                delay={index * 0.1}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* Confirmation Modal */}
            <AnimatePresence>
                {confirmationModalOpen && selectedProvider && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                        <motion.div
                            className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full"
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            transition={{ duration: 0.3 }}
                        >
                            <div className="p-6">
                                <div className="text-center mb-4">
                                    <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 mb-4">
                                        <Heart className="h-8 w-8" />
                                    </div>
                                    <h2 className="text-2xl font-bold mb-2">{t('confirmProviderSelection')}</h2>
                                    <p className="text-gray-600 dark:text-gray-400">
                                        {t('confirmProviderText', { provider: selectedProvider.name })}
                                    </p>
                                </div>

                                <div className="flex justify-center gap-4 mt-6">
                                    <Button
                                        variant="outline"
                                        onClick={() => setConfirmationModalOpen(false)}
                                    >
                                        {t('cancel')}
                                    </Button>
                                    <Button
                                        variant="default"
                                        onClick={handleSelectProvider}
                                        disabled={loading}
                                    >
                                        {loading ? (
                                            <div className="flex items-center">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                                                {t('processing')}
                                            </div>
                                        ) : (
                                            t('confirmSelection')
                                        )}
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}

// Provider Card Component
interface ProviderCardProps {
    provider: Provider;
    isCurrentProvider: boolean;
    onSelect: () => void;
    delay: number;
}

function ProviderCard({ provider, isCurrentProvider, onSelect, delay }: ProviderCardProps) {
    const t = useTranslations('Patients');
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 + delay }}
            className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden hover:shadow-lg transition-shadow"
        >
            <div className="md:flex">
                <div className="md:flex-shrink-0 p-6">
                    <Image
                        src={provider.imageUrl}
                        alt={provider.name}
                        width={128}
                        height={128}
                        className="h-32 w-32 rounded-full object-cover border-4 border-blue-100"
                        unoptimized
                    />
                </div>
                <div className="p-6 md:flex-1">
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between">
                        <div>
                            <div className="flex items-center">
                                <h2 className="text-xl font-bold text-gray-900 dark:text-white">{provider.name}</h2>
                                {isCurrentProvider && (
                                    <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                        {t('current')}
                                    </span>
                                )}
                            </div>
                            <p className="text-blue-600 dark:text-blue-400 font-medium">{provider.specialty}</p>
                            <div className="flex items-center mt-1">
                                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                <span className="ml-1 text-gray-700 dark:text-gray-300">{provider.rating} ({provider.reviewCount} {t('reviews')})</span>
                            </div>
                            <div className="mt-2 flex items-center text-gray-600 dark:text-gray-400">
                                <Briefcase className="h-4 w-4 mr-1" />
                                <span>{provider.yearsExperience} {t('yearsExperience')}</span>
                            </div>
                            <div className="mt-1 flex items-center text-gray-600 dark:text-gray-400">
                                <MapPin className="h-4 w-4 mr-1" />
                                <span>{provider.location}</span>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-1">
                                {provider.languages.map(lang => (
                                    <span key={lang} className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                        {lang}
                                    </span>
                                ))}
                            </div>
                        </div>

                        <div className="mt-4 md:mt-0 flex flex-col space-y-2">
                            <Button
                                variant={isCurrentProvider ? "outline" : "gradient"}
                                className="rounded-full"
                                onClick={onSelect}
                                disabled={isCurrentProvider}
                            >
                                {isCurrentProvider ? t('currentProvider') : t('selectProvider')}
                            </Button>
                            <Button
                                variant="outline"
                                className="rounded-full"
                                onClick={() => {/* View provider profile */ }}
                            >
                                {t('viewProfile')}
                                <ArrowRight className="ml-1 h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <h3 className="font-medium text-gray-900 dark:text-white mb-2">{t('about')}</h3>
                        <p className="text-gray-600 dark:text-gray-400 line-clamp-2">{provider.about}</p>
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
