import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs));
}

export function formatDate(date: Date | string | number): string {
    try {
        const dateObj = date instanceof Date ? date : new Date(date);

        // Check if date is valid
        if (isNaN(dateObj.getTime())) {
            return 'Invalid date';
        }

        return new Intl.DateTimeFormat('en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
        }).format(dateObj);
    } catch (error) {
        console.error('Error formatting date:', error);
        return 'Invalid date';
    }
}

export function formatTime(date: Date | string | number): string {
    try {
        const dateObj = date instanceof Date ? date : new Date(date);

        // Check if date is valid
        if (isNaN(dateObj.getTime())) {
            return 'Invalid time';
        }

        return new Intl.DateTimeFormat('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        }).format(dateObj);
    } catch (error) {
        console.error('Error formatting time:', error);
        return 'Invalid time';
    }
}

export function generateId(): string {
    return Math.random().toString(36).substr(2, 9);
}

export function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

export function validatePhone(phone: string): boolean {
    const phoneRegex = /^\+?[\d\s-()]+$/;
    return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

export function getRiskColor(risk: string): string {
    switch (risk.toLowerCase()) {
        case 'low':
            return 'text-green-600 bg-green-100';
        case 'medium':
            return 'text-yellow-600 bg-yellow-100';
        case 'high':
            return 'text-orange-600 bg-orange-100';
        case 'critical':
            return 'text-red-600 bg-red-100';
        default:
            return 'text-gray-600 bg-gray-100';
    }
}

export function getUrgencyColor(urgency: string): string {
    switch (urgency.toLowerCase()) {
        case 'routine':
            return 'text-blue-600 bg-blue-100';
        case 'urgent':
            return 'text-orange-600 bg-orange-100';
        case 'emergency':
            return 'text-red-600 bg-red-100';
        default:
            return 'text-gray-600 bg-gray-100';
    }
}