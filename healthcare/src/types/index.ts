import 'next-auth';

// Empty declaration to avoid conflicts with src/lib/auth.ts declarations
declare module 'next-auth' {
    // Use the declarations from src/lib/auth.ts
}

declare module 'next-auth/jwt' {
    interface JWT {
        role: string | null;
    }
}

export interface UserProfile {
    age?: number;
    gender?: string;
    phone?: string;
    location?: string;
    emergencyContact?: {
        name: string;
        phone: string;
        relationship: string;
    };
}

export interface MedicalHistory {
    condition: string;
    diagnosis: string;
    date: Date;
    severity: string;
}

export interface RecentActivity {
    type: 'symptom_check' | 'consultation' | 'prescription' | 'report' | 'emergency';
    title: string;
    description: string;
    date: Date;
    status: 'completed' | 'pending' | 'active' | 'cancelled';
    referenceId?: string;
    referenceModel?: 'SymptomCheck' | 'Consultation';
}

export interface Symptom {
    name: string;
    severity: 'mild' | 'moderate' | 'severe';
    duration: string;
    description?: string;
}

export interface AIAnalysis {
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    recommendations: string[];
    possibleConditions: {
        condition: string;
        probability: number;
        description: string;
    }[];
    urgency: 'routine' | 'urgent' | 'emergency';
}

export interface Consultation {
    _id: string;
    patientId: string;
    providerId?: string;
    provider?: {
        name: string;
        specialty: string;
        profileImage?: string;
    };
    reason: string;
    type: 'video' | 'audio' | 'message';
    status: 'scheduled' | 'in-progress' | 'completed' | 'cancelled';
    scheduledFor: Date;
    duration: number;
    priority?: 'low' | 'medium' | 'high';
    notes?: string;
    diagnosis?: string;
    prescriptions?: Prescription[];
    aiTriageData?: {
        riskLevel: 'low' | 'medium' | 'high' | 'critical';
        urgency: 'routine' | 'urgent' | 'emergency';
        recommendations?: string[];
        possibleConditions?: {
            condition: string;
            probability: number;
            description: string;
        }[];
    };
    followUp?: {
        required: boolean;
        scheduledAt?: Date;
        notes?: string;
    };
    rating?: {
        score: number;
        feedback: string;
    };
}

export interface Prescription {
    medication: string;
    dosage: string;
    frequency: string;
    duration: string;
    instructions: string;
}

export interface Meeting {
    _id: string;
    patientId: string;
    doctorId: string;
    type: 'text' | 'audio' | 'video';
    status: 'scheduled' | 'active' | 'ended' | 'cancelled';
    scheduledFor: Date;
    reason: string;
    roomId: string;
    notes?: string;
    messages: MeetingMessage[];
    startedAt?: Date;
    endedAt?: Date;
    patient?: {
        _id: string;
        name: string;
        email: string;
    };
    doctor?: {
        _id: string;
        name: string;
        email: string;
        specialty?: string;
    };
}

export interface MeetingMessage {
    senderId: string;
    senderName: string;
    senderRole: 'patient' | 'provider';
    content: string;
    timestamp: Date;
}

export interface MeetingNotification {
    id: string;
    type: 'meeting_scheduled' | 'meeting_active' | 'meeting_cancelled' | 'meeting_ended' | 'system';
    title: string;
    message: string;
    read: boolean;
    timestamp: Date;
    referenceId?: string;
    metadata?: {
        meetingType?: string;
        patientName?: string;
        doctorName?: string;
        scheduledFor?: Date;
    };
}
