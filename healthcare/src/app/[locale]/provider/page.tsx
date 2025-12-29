'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { useRouter } from '@/navigation';
import {
    Calendar,
    Clock,
    Search,
    Star,
    MapPin,
    Filter,
    Briefcase,
    ChevronDown,
    ChevronRight,
    MessageCircle,
    Video,
    Calendar as CalendarIcon
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

// Types for our provider data
interface Provider {
    id: string;
    name: string;
    specialty: string;
    rating: number;
    reviewCount: number;
    yearsExperience: number;
    location: string;
    imageUrl: string;
    availableSlots: string[];
    languages: string[];
    education: string[];
    price: number;
    about: string;
    services: string[];
}

// Sample provider data
const providersData: Provider[] = [
    {
        id: '1',
        name: 'Dr. Sarah Johnson',
        specialty: 'Cardiology',
        rating: 4.9,
        reviewCount: 127,
        yearsExperience: 12,
        location: 'New York, NY',
        imageUrl: 'https://randomuser.me/api/portraits/women/44.jpg',
        availableSlots: ['Today, 2:00 PM', 'Today, 4:30 PM', 'Tomorrow, 10:00 AM'],
        languages: ['English', 'Spanish'],
        education: ['Harvard Medical School', 'Johns Hopkins University'],
        price: 150,
        about: 'Specialist in cardiovascular health with over 12 years of experience in treating heart conditions and preventative care.',
        services: ['Cardiac Consultation', 'EKG', 'Heart Health Assessment']
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
        availableSlots: ['Today, 3:15 PM', 'Tomorrow, 9:00 AM', 'Tomorrow, 2:30 PM'],
        languages: ['English', 'Mandarin'],
        education: ['Stanford University', 'UCSF Medical Center'],
        price: 120,
        about: 'Pediatrician dedicated to providing comprehensive healthcare for children from infancy through adolescence.',
        services: ['Well-Child Visits', 'Vaccinations', 'Growth & Development Assessment']
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
        availableSlots: ['Tomorrow, 1:00 PM', 'Friday, 11:30 AM', 'Friday, 3:45 PM'],
        languages: ['English', 'French', 'Yoruba'],
        education: ['Yale School of Medicine', 'Massachusetts General Hospital'],
        price: 175,
        about: 'Neurologist specializing in headache disorders, stroke care, and neurodegenerative diseases.',
        services: ['Neurological Evaluation', 'Headache Treatment', 'Cognitive Assessment']
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
        availableSlots: ['Today, 5:00 PM', 'Tomorrow, 11:00 AM', 'Friday, 2:00 PM'],
        languages: ['English', 'Spanish'],
        education: ['University of Miami', 'Mayo Clinic'],
        price: 110,
        about: 'Family physician providing comprehensive care for patients of all ages, with a focus on preventative health.',
        services: ['Primary Care', 'Preventative Screenings', 'Chronic Disease Management']
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
        availableSlots: ['Tomorrow, 10:30 AM', 'Friday, 1:15 PM', 'Friday, 4:00 PM'],
        languages: ['English', 'Hindi', 'Gujarati'],
        education: ['Northwestern University', 'University of Chicago'],
        price: 160,
        about: 'Board-certified dermatologist specializing in medical, surgical, and cosmetic dermatology.',
        services: ['Skin Exams', 'Acne Treatment', 'Cosmetic Procedures']
    }
];

// Main component
export default function ProviderPage() {
    const t = useTranslations('Provider');
    const router = useRouter();
    const [providers, setProviders] = useState<Provider[]>(providersData);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
    const [showFilters, setShowFilters] = useState(false);
    const [selectedProvider, setSelectedProvider] = useState<Provider | null>(null);

    // List of specialties derived from providers
    const specialties = Array.from(new Set(providersData.map(p => p.specialty)));

    // Filter providers based on search term and specialty
    useEffect(() => {
        let filtered = providersData;

        if (searchTerm) {
            filtered = filtered.filter(p =>
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                p.specialty.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (selectedSpecialty) {
            filtered = filtered.filter(p => p.specialty === selectedSpecialty);
        }

        setProviders(filtered);
    }, [searchTerm, selectedSpecialty]);

    // Handle scheduling
    const handleSchedule = (provider: Provider, slot: string) => {
        // In a real app, this would create a consultation and redirect
        console.log(`Scheduling with ${provider.name} at ${slot}`);

        // Redirect to consultation form
        router.push(`/consultations/new?providerId=${provider.id}&slot=${encodeURIComponent(slot)}`);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
            <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
                {/* Hero Section */}
                <div className="text-center mb-12">
                    <motion.h1
                        className="text-4xl font-bold text-gray-900 dark:text-white mb-4"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        {t('findDoctor')}
                    </motion.h1>
                    <motion.p
                        className="text-xl text-gray-600 dark:text-gray-300"
                        initial={{ opacity: 0, y: -20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.5, delay: 0.1 }}
                    >
                        {t('findDoctorSubtitle')}
                    </motion.p>
                </div>

                {/* Search and Filter Section */}
                <motion.div
                    className="mb-8 bg-white dark:bg-gray-800 rounded-xl shadow-md p-6"
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                >
                    <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="relative flex-grow">
                            <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                            <Input
                                type="text"
                                placeholder={t('searchPlaceholder')}
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
                    {providers.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="mb-4">
                                <Search className="h-12 w-12 mx-auto text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 dark:text-white">{t('noProvidersFound')}</h3>
                            <p className="mt-1 text-gray-500 dark:text-gray-400">{t('tryAdjustingFilters')}</p>
                        </div>
                    ) : (
                        providers.map((provider, index) => (
                            <ProviderCard
                                key={provider.id}
                                provider={provider}
                                onSchedule={handleSchedule}
                                onSelect={() => setSelectedProvider(provider)}
                                delay={index * 0.1}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* Provider Detail Modal */}
            <AnimatePresence>
                {selectedProvider && (
                    <ProviderDetailModal
                        provider={selectedProvider}
                        onClose={() => setSelectedProvider(null)}
                        onSchedule={handleSchedule}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}

// Provider Card Component
interface ProviderCardProps {
    provider: Provider;
    onSchedule: (provider: Provider, slot: string) => void;
    onSelect: () => void;
    delay: number;
}

function ProviderCard({ provider, onSchedule, onSelect, delay }: ProviderCardProps) {
    const t = useTranslations('Provider');
    const [expanded, setExpanded] = useState(false);

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
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white">{provider.name}</h2>
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
                        </div>

                        <div className="mt-4 md:mt-0 flex flex-col space-y-2">
                            <Button
                                variant="gradient"
                                className="rounded-full"
                                onClick={onSelect}
                            >
                                {t('viewProfile')}
                            </Button>
                            <Button
                                variant="outline"
                                className="rounded-full"
                                onClick={() => setExpanded(!expanded)}
                            >
                                {expanded ? t('hideSlots') : t('showAvailability')}
                                <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`} />
                            </Button>
                        </div>
                    </div>

                    {/* Available slots */}
                    <AnimatePresence>
                        {expanded && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
                            >
                                <h3 className="font-medium text-gray-900 dark:text-white mb-2">{t('availableSlots')}</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    {provider.availableSlots.map((slot, index) => (
                                        <Button
                                            key={index}
                                            variant="outline"
                                            size="sm"
                                            className="justify-between"
                                            onClick={() => onSchedule(provider, slot)}
                                        >
                                            <Clock className="h-3 w-3 mr-1" />
                                            <span>{slot}</span>
                                            <ChevronRight className="h-3 w-3 ml-1" />
                                        </Button>
                                    ))}
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </motion.div>
    );
}

// Provider Detail Modal
interface ProviderDetailModalProps {
    provider: Provider;
    onClose: () => void;
    onSchedule: (provider: Provider, slot: string) => void;
}

function ProviderDetailModal({ provider, onClose, onSchedule }: ProviderDetailModalProps) {
    const t = useTranslations('Provider');
    const [activeTab, setActiveTab] = useState('about');

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <motion.div
                className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ duration: 0.3 }}
            >
                <div className="relative">
                    <button
                        onClick={onClose}
                        className="absolute top-4 right-4 p-2 rounded-full bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                    </button>

                    {/* Provider Header */}
                    <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex flex-col md:flex-row items-center md:items-start gap-4">
                        <Image
                            src={provider.imageUrl}
                            alt={provider.name}
                            width={128}
                            height={128}
                            className="h-32 w-32 rounded-full object-cover border-4 border-blue-100"
                            unoptimized
                        />
                        <div className="flex-1 text-center md:text-left">
                            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{provider.name}</h2>
                            <p className="text-blue-600 dark:text-blue-400 font-medium">{provider.specialty}</p>
                            <div className="flex items-center mt-1 justify-center md:justify-start">
                                <Star className="h-4 w-4 text-yellow-500 fill-current" />
                                <span className="ml-1 text-gray-700 dark:text-gray-300">{provider.rating} ({provider.reviewCount} {t('reviews')})</span>
                            </div>
                            <div className="mt-2 flex items-center text-gray-600 dark:text-gray-400 justify-center md:justify-start">
                                <Briefcase className="h-4 w-4 mr-1" />
                                <span>{provider.yearsExperience} {t('yearsExperience')}</span>
                                <span className="mx-2">•</span>
                                <MapPin className="h-4 w-4 mr-1" />
                                <span>{provider.location}</span>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2 justify-center md:justify-start">
                                {provider.languages.map(lang => (
                                    <span key={lang} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                        {lang}
                                    </span>
                                ))}
                            </div>
                        </div>
                        <div className="md:self-start flex flex-col gap-2">
                            <div className="text-xl font-bold text-gray-900 dark:text-white">${provider.price}</div>
                            <Button variant="gradient" className="rounded-full flex items-center gap-1" onClick={() => document.getElementById('booking-section')?.scrollIntoView({ behavior: 'smooth' })}>
                                <Calendar className="h-4 w-4" />
                                {t('bookAppointment')}
                            </Button>
                            <div className="flex gap-2">
                                <Button variant="outline" size="sm" className="rounded-full flex-1 flex items-center justify-center gap-1">
                                    <MessageCircle className="h-4 w-4" />
                                    {t('chat')}
                                </Button>
                                <Button variant="outline" size="sm" className="rounded-full flex-1 flex items-center justify-center gap-1">
                                    <Video className="h-4 w-4" />
                                    {t('video')}
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="border-b border-gray-200 dark:border-gray-700">
                        <div className="flex space-x-2 p-4">
                            {['about', 'services', 'education', 'booking'].map((tab) => (
                                <button
                                    key={tab}
                                    className={`px-4 py-2 font-medium rounded-lg transition-colors ${activeTab === tab
                                            ? 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400'
                                            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                                        }`}
                                    onClick={() => setActiveTab(tab)}
                                >
                                    {t(tab)}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Tab Content */}
                    <div className="p-6">
                        {activeTab === 'about' && (
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">{t('aboutDoctor')}</h3>
                                <p className="text-gray-700 dark:text-gray-300">{provider.about}</p>
                            </div>
                        )}

                        {activeTab === 'services' && (
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{t('services')}</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {provider.services.map((service, index) => (
                                        <div key={index} className="flex items-start">
                                            <div className="flex-shrink-0 h-5 w-5 text-blue-600">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                                </svg>
                                            </div>
                                            <p className="ml-2 text-gray-700 dark:text-gray-300">{service}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'education' && (
                            <div>
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{t('education')}</h3>
                                <div className="space-y-4">
                                    {provider.education.map((edu, index) => (
                                        <div key={index} className="flex items-start">
                                            <div className="flex-shrink-0 h-5 w-5 text-blue-600">
                                                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                                                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                                                </svg>
                                            </div>
                                            <p className="ml-2 text-gray-700 dark:text-gray-300">{edu}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {activeTab === 'booking' && (
                            <div id="booking-section">
                                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">{t('availableSlots')}</h3>
                                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                                    {provider.availableSlots.map((slot, index) => (
                                        <Button
                                            key={index}
                                            variant="outline"
                                            className="justify-between"
                                            onClick={() => onSchedule(provider, slot)}
                                        >
                                            <CalendarIcon className="h-4 w-4 mr-1" />
                                            <span>{slot}</span>
                                            <ChevronRight className="h-4 w-4 ml-1" />
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </div>
    );
}
