import twilio from 'twilio';

// Initialize Twilio client
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

// Only initialize the client if the required environment variables are set
const client = accountSid && authToken ? twilio(accountSid, authToken) : null;

/**
 * Send an SMS message using Twilio
 * @param to - Recipient phone number (with country code, e.g. +1234567890)
 * @param body - Text message content
 */
export async function sendSMS(to: string, body: string) {
    if (!client || !twilioPhoneNumber) {
        throw new Error('Twilio is not properly configured');
    }

    try {
        const message = await client.messages.create({
            body,
            from: twilioPhoneNumber,
            to,
        });

        return {
            success: true,
            sid: message.sid,
            status: message.status,
        };
    } catch (error) {
        console.error('Error sending SMS:', error);
        throw error;
    }
}

/**
 * Send a health reminder SMS
 * @param to - Recipient phone number
 * @param patientName - Patient's name
 * @param reminderType - Type of reminder (medication, appointment, etc.)
 * @param details - Specific details about the reminder
 */
export async function sendHealthReminder(
    to: string,
    patientName: string,
    reminderType: 'medication' | 'appointment' | 'check-in',
    details: string
) {
    let message = `Hello ${patientName}, `;

    switch (reminderType) {
        case 'medication':
            message += `it's time for your medication: ${details}`;
            break;
        case 'appointment':
            message += `reminder for your upcoming appointment: ${details}`;
            break;
        case 'check-in':
            message += `please complete your health check-in: ${details}`;
            break;
        default:
            message += details;
    }

    message += "\nReply HELP for assistance or STOP to unsubscribe.";

    return sendSMS(to, message);
}

/**
 * Send an emergency alert SMS
 * @param to - Recipient phone number
 * @param alertType - Type of emergency alert
 * @param message - Custom alert message
 */
export async function sendEmergencyAlert(
    to: string,
    alertType: 'urgent' | 'critical' | 'warning',
    message: string
) {
    let prefix = '';

    switch (alertType) {
        case 'urgent':
            prefix = '🚨 URGENT: ';
            break;
        case 'critical':
            prefix = '⚠️ CRITICAL: ';
            break;
        case 'warning':
            prefix = '⚠️ WARNING: ';
            break;
    }

    return sendSMS(to, `${prefix}${message}\nReply HELP for assistance.`);
}

/**
 * Check if Twilio is properly configured
 */
export function isTwilioConfigured() {
    return Boolean(client && twilioPhoneNumber);
}

// Named export object to comply with ESLint rule
const twilioService = {
    sendSMS,
    sendHealthReminder,
    sendEmergencyAlert,
    isTwilioConfigured,
};

export default twilioService;
