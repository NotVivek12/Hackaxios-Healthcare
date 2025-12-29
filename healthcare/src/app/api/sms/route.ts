import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import { sendSMS, sendHealthReminder, isTwilioConfigured } from '@/lib/sms/twilio';
import { z } from 'zod';

// Define validation schemas using Zod
const BaseSchema = z.object({
    phoneNumber: z.string()
        .regex(/^\+[1-9]\d{1,14}$/, 'Invalid phone number format. Use international format (e.g., +1234567890)'),
});

const ReminderSchema = BaseSchema.extend({
    messageType: z.literal('reminder'),
    recipientName: z.string().min(2, 'Recipient name is required'),
    content: z.object({
        reminderType: z.enum(['appointment', 'medication', 'check-in'], {
            errorMap: () => ({ message: 'Invalid reminder type' }),
        }),
        details: z.string().min(3, 'Reminder details are required'),
    }),
});

const RegularSMSSchema = BaseSchema.extend({
    messageType: z.enum(['general', 'alert', 'info']),
    content: z.string().min(3, 'Message content is required'),
    recipientName: z.string().optional(),
});

// Union of all valid request types
const RequestSchema = z.discriminatedUnion('messageType', [
    ReminderSchema,
    RegularSMSSchema,
]);

/**
 * SMS API Endpoint
 * 
 * This endpoint handles sending SMS messages to patients or providers.
 * It supports both regular text messages and structured health reminders.
 * 
 * @param {NextRequest} request - The incoming request object
 * @returns {NextResponse} Response with success status or error details
 */
export async function POST(request: NextRequest) {
    try {
        // Verify authentication
        const session = await getServerSession(authOptions);

        if (!session) {
            return NextResponse.json({
                error: 'Unauthorized',
                message: 'You must be signed in to use this service'
            }, {
                status: 401,
                headers: {
                    'WWW-Authenticate': 'Bearer'
                }
            });
        }

        // Check user permissions for sending SMS
        if (session.user?.role !== 'admin' && session.user?.role !== 'provider') {
            // Log unauthorized access attempt for security monitoring
            console.warn(`Unauthorized SMS send attempt by user: ${session.user?.id}`);

            return NextResponse.json({
                error: 'Forbidden',
                message: 'You do not have permission to send SMS messages'
            }, { status: 403 });
        }

        // Check if Twilio is configured
        if (!isTwilioConfigured()) {
            return NextResponse.json({
                error: 'Service Unavailable',
                message: 'SMS service is not configured',
                code: 'TWILIO_NOT_CONFIGURED'
            }, { status: 503 });
        }

        // Parse and validate request body
        const requestData = await request.json().catch(() => ({}));

        const validationResult = RequestSchema.safeParse(requestData);

        if (!validationResult.success) {
            const formattedErrors = validationResult.error.format();

            return NextResponse.json({
                error: 'Bad Request',
                message: 'Invalid request data',
                validation: formattedErrors
            }, { status: 400 });
        }

        const validData = validationResult.data;
        let result;

        // Send appropriate message type
        if (validData.messageType === 'reminder') {
            result = await sendHealthReminder(
                validData.phoneNumber,
                validData.recipientName,
                validData.content.reminderType,
                validData.content.details
            );
        } else {
            // Regular SMS
            result = await sendSMS(validData.phoneNumber, validData.content);
        }

        // Log successful SMS for audit purposes
        console.info(`SMS sent by ${session.user?.id} to ${validData.phoneNumber.substring(0, 6)}***`);

        return NextResponse.json({
            success: true,
            messageId: result.sid,
            timestamp: new Date().toISOString()
        });

    } catch (error) {
        console.error('SMS API error:', error);

        // Define a type for Twilio errors
        interface TwilioError extends Error {
            code: string;
            status?: number;
            moreInfo?: string;
        }

        // Determine if this is a Twilio API error
        const isTwilioError = error instanceof Error &&
            'code' in error &&
            typeof (error as TwilioError).code === 'string' &&
            (error as TwilioError).code.startsWith('TWILIO');

        if (isTwilioError) {
            const twilioError = error as TwilioError;

            // Handle specific Twilio error codes
            if (twilioError.code === 'TWILIO_INVALID_NUMBER') {
                return NextResponse.json({
                    error: 'Bad Request',
                    message: 'The phone number provided is invalid or unverified',
                    code: twilioError.code
                }, { status: 400 });
            }

            if (twilioError.code === 'TWILIO_ACCOUNT_LIMIT') {
                return NextResponse.json({
                    error: 'Service Unavailable',
                    message: 'SMS sending limit reached. Please try again later',
                    code: twilioError.code
                }, { status: 429 });
            }
        }

        // Generic error response
        return NextResponse.json({
            error: 'Internal Server Error',
            message: 'Failed to send SMS',
            details: error instanceof Error ? error.message : 'Unknown error',
            code: 'SMS_SEND_FAILED'
        }, { status: 500 });
    }
}
