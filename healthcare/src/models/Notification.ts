import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    type: {
        type: String,
        enum: ['meeting_scheduled', 'meeting_active', 'meeting_cancelled', 'meeting_ended', 'system'],
        required: true,
    },
    title: {
        type: String,
        required: true,
    },
    message: {
        type: String,
        required: true,
    },
    read: {
        type: Boolean,
        default: false,
    },
    referenceId: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'referenceModel',
    },
    referenceModel: {
        type: String,
        enum: ['Meeting', 'User'],
    },
    metadata: {
        meetingType: String,
        patientName: String,
        doctorName: String,
        scheduledFor: Date,
    },
}, {
    timestamps: true,
});

// Index for efficient queries
NotificationSchema.index({ userId: 1, read: 1 });
NotificationSchema.index({ createdAt: -1 });

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
