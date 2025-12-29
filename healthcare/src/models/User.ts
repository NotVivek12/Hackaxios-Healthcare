import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: false, // Not required for OAuth users
    },
    role: {
        type: String,
        enum: ['patient', 'provider', 'admin'],
        default: 'patient',
    },
    profile: {
        age: Number,
        gender: String,
        phone: String,
        location: String,
        emergencyContact: {
            name: String,
            phone: String,
            relationship: String,
        },
        // Provider-specific fields
        specialty: String,
        yearsExperience: Number,
        bio: String,
        education: [{
            institution: String,
            degree: String,
            year: Number
        }],
        services: [String],
        reviews: [{
            rating: Number,
            comment: String,
            from: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            date: {
                type: Date,
                default: Date.now
            }
        }],
        averageRating: {
            type: Number,
            default: 0
        }
    },
    // Provider-patient relationship fields
    assignedProvider: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    patients: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    providerRequests: [{
        provider: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        status: {
            type: String,
            enum: ['pending', 'approved', 'rejected'],
            default: 'pending'
        },
        requestDate: {
            type: Date,
            default: Date.now
        }
    }],
    medicalHistory: [{
        condition: String,
        diagnosis: String,
        date: Date,
        severity: String,
    }],
    recentActivities: [{
        type: {
            type: String,
            enum: ['symptom_check', 'consultation', 'prescription', 'report', 'emergency'],
        },
        title: String,
        description: String,
        date: {
            type: Date,
            default: Date.now,
        },
        status: {
            type: String,
            enum: ['completed', 'pending', 'active', 'cancelled'],
        },
        referenceId: {
            type: mongoose.Schema.Types.ObjectId,
            refPath: 'recentActivities.referenceModel'
        },
        referenceModel: {
            type: String,
            enum: ['SymptomCheck', 'Consultation'],
            default: 'SymptomCheck'
        }
    }],
    preferences: {
        language: { type: String, default: 'en' },
        theme: { type: String, enum: ['light', 'dark', 'system'], default: 'system' },
        notifications: {
            email: { type: Boolean, default: true },
            push: { type: Boolean, default: true },
            sms: { type: Boolean, default: false },
            appointments: { type: Boolean, default: true },
            reminders: { type: Boolean, default: true },
            updates: { type: Boolean, default: false },
        },
        accessibility: {
            fontSize: { type: String, enum: ['small', 'medium', 'large'], default: 'medium' },
            highContrast: { type: Boolean, default: false },
            reducedMotion: { type: Boolean, default: false },
            soundEffects: { type: Boolean, default: true },
        },
    },
}, {
    timestamps: true,
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
