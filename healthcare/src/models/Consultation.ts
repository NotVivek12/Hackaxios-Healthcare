import mongoose from 'mongoose';

const ConsultationSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    providerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },
    reason: {
        type: String,
        required: true,
    },
    type: {
        type: String,
        enum: ['video', 'audio', 'message'],
        default: 'video',
    },
    status: {
        type: String,
        enum: ['scheduled', 'in-progress', 'completed', 'cancelled'],
        default: 'scheduled',
    },
    scheduledFor: {
        type: Date,
        required: true,
    },
    duration: {
        type: Number, // in minutes
        default: 30,
    },
    notes: {
        type: String,
    },
    diagnosis: {
        type: String,
    },
    prescriptions: [{
        medication: String,
        dosage: String,
        frequency: String,
        duration: String,
        instructions: String,
    }],
    followUp: {
        required: Boolean,
        scheduledAt: Date,
        notes: String,
    },
    rating: {
        score: Number,
        feedback: String,
    },
    // New fields for AI triage integration
    priority: {
        type: String,
        enum: ['normal', 'medium', 'high'],
        default: 'normal'
    },
    aiTriageData: {
        riskLevel: {
            type: String,
            enum: ['low', 'medium', 'high', 'critical']
        },
        urgency: {
            type: String,
            enum: ['routine', 'urgent', 'emergency']
        },
        autoScheduled: {
            type: Boolean,
            default: false
        },
        triageTime: Date,
        symptoms: [String],
        triageSource: {
            type: String,
            enum: ['web', 'sms', 'manual'],
            default: 'web'
        }
    }
}, {
    timestamps: true,
});

export default mongoose.models.Consultation || mongoose.model('Consultation', ConsultationSchema);
