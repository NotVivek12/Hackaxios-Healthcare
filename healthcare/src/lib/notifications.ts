export type ActivityType = 'symptom_check' | 'consultation' | 'prescription' | 'report' | 'emergency';
export type NotificationType = 'appointment' | 'reminder' | 'alert' | 'update';

export interface ActivityRecord {
    _id?: { toString(): string } | string;
    type: ActivityType | string;
    date?: string | Date;
    title?: string;
    description?: string;
    [key: string]: unknown;
}

export interface NotificationPayload {
    id: string;
    type: NotificationType;
    title: string;
    message: string;
    timestamp: string | Date;
    action?: {
        label: string;
        href: string;
    };
}

export function mapActivityToNotification(activity: ActivityRecord): NotificationPayload {
    const base = {
        id: typeof activity._id === 'string' ? activity._id : activity._id?.toString() ?? `${activity.type}-${activity.date ?? ''}`,
        timestamp: activity.date ?? new Date().toISOString(),
    };

    switch (activity.type as ActivityType) {
        case 'consultation':
            return {
                ...base,
                type: 'appointment',
                title: 'Consultation update',
                message: activity.title || 'Your consultation has an update',
                action: { label: 'Open', href: '/consultations' },
            };
        case 'emergency':
            return {
                ...base,
                type: 'alert',
                title: 'Emergency notice',
                message: activity.description || 'An emergency action was recorded',
                action: { label: 'View', href: '/dashboard' },
            };
        case 'report':
            return {
                ...base,
                type: 'update',
                title: 'New report available',
                message: activity.title || 'A new health report is available',
                action: { label: 'View records', href: '/health-records' },
            };
        case 'prescription':
            return {
                ...base,
                type: 'reminder',
                title: 'Prescription update',
                message: activity.description || 'Your prescription has been updated',
                action: { label: 'Open', href: '/health-records' },
            };
        case 'symptom_check':
        default:
            return {
                ...base,
                type: 'update',
                title: 'Symptom check completed',
                message: activity.title || 'A symptom check result is ready',
                action: { label: 'View', href: '/symptom-checker' },
            };
    }
}

export function buildNotificationsFromActivities(
    activities: ActivityRecord[] = [],
    limit = 20,
): NotificationPayload[] {
    return activities
        .filter(Boolean)
        .sort((a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime())
        .slice(0, limit)
        .map(mapActivityToNotification);
}
