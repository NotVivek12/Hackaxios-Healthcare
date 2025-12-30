import mongoose from 'mongoose';

const MeetingSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    doctorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    type: {
        type: String,
        enum: ['text', 'audio', 'video'],
        required: true,
        default: 'video',
    },
    status: {
        type: String,
        enum: ['scheduled', 'active', 'ended', 'cancelled'],
        default: 'scheduled',
    },
    scheduledFor: {
        type: Date,
        required: true,
    },
    reason: {
        type: String,
        required: true,
    },
    roomId: {
        type: String,
        unique: true,
    },
    notes: {
        type: String,
    },
    messages: [{
        senderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        senderName: String,
        senderRole: {
            type: String,
            enum: ['patient', 'provider'],
        },
        content: String,
        timestamp: {
            type: Date,
            default: Date.now,
        },
    }],
    startedAt: {
        type: Date,
    },
    endedAt: {
        type: Date,
    },
}, {
    timestamps: true,
});

// Generate unique room ID before saving
MeetingSchema.pre('save', function(next) {
    if (!this.roomId) {
        this.roomId = `meeting_${this._id}_${Date.now()}`;
    }
    next();
});

// Index for efficient queries
MeetingSchema.index({ patientId: 1, status: 1 });
MeetingSchema.index({ doctorId: 1, status: 1 });
MeetingSchema.index({ scheduledFor: 1 });
// roomId already has unique: true which creates an index

export default mongoose.models.Meeting || mongoose.model('Meeting', MeetingSchema);
