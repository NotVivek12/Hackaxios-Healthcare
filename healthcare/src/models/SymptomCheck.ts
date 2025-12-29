import mongoose from 'mongoose';

const SymptomCheckSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    symptoms: [{
        name: String,
        severity: {
            type: String,
            enum: ['mild', 'moderate', 'severe'],
        },
        duration: String,
        description: String,
    }],
    aiAnalysis: {
        riskLevel: {
            type: String,
            enum: ['low', 'medium', 'high', 'critical'],
        },
        recommendations: [String],
        possibleConditions: [{
            condition: String,
            probability: Number,
            description: String,
        }],
        urgency: {
            type: String,
            enum: ['routine', 'urgent', 'emergency'],
        },
    },
    followUpRequired: {
        type: Boolean,
        default: false,
    },
    status: {
        type: String,
        enum: ['pending', 'reviewed', 'completed'],
        default: 'pending',
    },
}, {
    timestamps: true,
});

export default mongoose.models.SymptomCheck || mongoose.model('SymptomCheck', SymptomCheckSchema);
