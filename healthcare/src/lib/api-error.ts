/**
 * API Error Handler Utility
 * 
 * This module provides standardized error handling for API routes
 * across the AI-HealthCare platform. It includes common error types,
 * logging functionality, and consistent error response formatting.
 */

import { NextResponse } from 'next/server';

// Standard HTTP error codes and messages
export enum HttpStatusCode {
    BAD_REQUEST = 400,
    UNAUTHORIZED = 401,
    FORBIDDEN = 403,
    NOT_FOUND = 404,
    METHOD_NOT_ALLOWED = 405,
    CONFLICT = 409,
    UNPROCESSABLE_ENTITY = 422,
    TOO_MANY_REQUESTS = 429,
    INTERNAL_SERVER_ERROR = 500,
    SERVICE_UNAVAILABLE = 503,
}

// Define common error detail types
export type ErrorDetail = string | string[] | Record<string, unknown> | null | undefined;

// Error types for consistent error handling
export class ApiError extends Error {
    statusCode: HttpStatusCode;
    code: string;
    details?: ErrorDetail;
    loggable: boolean = true;

    constructor(
        message: string,
        statusCode: HttpStatusCode = HttpStatusCode.INTERNAL_SERVER_ERROR,
        code: string = 'API_ERROR',
        details?: ErrorDetail
    ) {
        super(message);
        this.name = 'ApiError';
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
    }

    toJSON() {
        return {
            error: this.message,
            code: this.code,
            ...(this.details && { details: this.details }),
        };
    }
}

// Specific error classes for common scenarios
export class BadRequestError extends ApiError {
    constructor(message: string = 'Bad Request', code: string = 'BAD_REQUEST', details?: ErrorDetail) {
        super(message, HttpStatusCode.BAD_REQUEST, code, details);
        this.name = 'BadRequestError';
    }
}

export class UnauthorizedError extends ApiError {
    constructor(message: string = 'Unauthorized', code: string = 'UNAUTHORIZED', details?: ErrorDetail) {
        super(message, HttpStatusCode.UNAUTHORIZED, code, details);
        this.name = 'UnauthorizedError';
    }
}

export class ForbiddenError extends ApiError {
    constructor(message: string = 'Forbidden', code: string = 'FORBIDDEN', details?: ErrorDetail) {
        super(message, HttpStatusCode.FORBIDDEN, code, details);
        this.name = 'ForbiddenError';
    }
}

export class NotFoundError extends ApiError {
    constructor(message: string = 'Not Found', code: string = 'NOT_FOUND', details?: ErrorDetail) {
        super(message, HttpStatusCode.NOT_FOUND, code, details);
        this.name = 'NotFoundError';
    }
}

export class RateLimitError extends ApiError {
    constructor(message: string = 'Too Many Requests', code: string = 'RATE_LIMIT', details?: ErrorDetail) {
        super(message, HttpStatusCode.TOO_MANY_REQUESTS, code, details);
        this.name = 'RateLimitError';
    }
}

export class InternalServerError extends ApiError {
    constructor(message: string = 'Internal Server Error', code: string = 'INTERNAL_ERROR', details?: ErrorDetail) {
        super(message, HttpStatusCode.INTERNAL_SERVER_ERROR, code, details);
        this.name = 'InternalServerError';
    }
}

export class ServiceUnavailableError extends ApiError {
    constructor(message: string = 'Service Unavailable', code: string = 'SERVICE_UNAVAILABLE', details?: ErrorDetail) {
        super(message, HttpStatusCode.SERVICE_UNAVAILABLE, code, details);
        this.name = 'ServiceUnavailableError';
    }
}

// Validation error for handling Zod validation failures
export class ValidationError extends BadRequestError {
    constructor(validationErrors: Record<string, unknown>) {
        super('Validation Error', 'VALIDATION_ERROR', validationErrors);
        this.name = 'ValidationError';
    }
}

// MongoDB error interface
interface MongoError extends Error {
    code: number;
    keyPattern?: Record<string, unknown>;
    keyValue?: Record<string, unknown>;
}

// Twilio error interface
interface TwilioError extends Error {
    code: string;
    status?: number;
    moreInfo?: string;
}

// Error handler function for API routes
export function handleApiError(error: unknown, includeDetails: boolean = false) {
    console.error('API Error:', error);

    // Already an ApiError
    if (error instanceof ApiError) {
        return NextResponse.json(
            {
                error: error.message,
                code: error.code,
                ...(includeDetails && error.details && { details: error.details }),
            },
            { status: error.statusCode }
        );
    }

    // MongoDB/Mongoose error
    if (error instanceof Error && 'name' in error && error.name === 'MongoServerError') {
        const mongoError = error as MongoError;
        if (mongoError.code === 11000) {
            // Duplicate key error
            return NextResponse.json(
                {
                    error: 'Duplicate entry',
                    code: 'DUPLICATE_ENTITY',
                    ...(includeDetails && { details: 'The record already exists' }),
                },
                { status: HttpStatusCode.CONFLICT }
            );
        }
    }

    // AI provider error handling (OpenAI/Groq/etc.)
    if (error instanceof Error) {
        const name = error.name || '';
        const message = error.message || '';
        if (/OpenAI|Groq/i.test(name) || /OpenAI|Groq/i.test(message)) {
            return NextResponse.json(
                {
                    error: 'AI Service Error',
                    code: 'AI_SERVICE_ERROR',
                    message: 'The AI analysis service is temporarily unavailable. Please try again later.',
                    ...(includeDetails && { details: error.message }),
                },
                { status: HttpStatusCode.SERVICE_UNAVAILABLE }
            );
        }
    }

    // Twilio API error
    if (
        error instanceof Error &&
        'code' in error &&
        typeof (error as TwilioError).code === 'string' &&
        (error as TwilioError).code.startsWith('TWILIO')
    ) {
        const twilioError = error as TwilioError;
        return NextResponse.json(
            {
                error: 'SMS Service Error',
                code: twilioError.code,
                ...(includeDetails && { details: error.message }),
            },
            { status: HttpStatusCode.SERVICE_UNAVAILABLE }
        );
    }

    // Default case: Unknown error
    const message = error instanceof Error ? error.message : 'Unknown error occurred';

    return NextResponse.json(
        {
            error: 'Internal Server Error',
            code: 'INTERNAL_ERROR',
            ...(includeDetails && { details: message }),
        },
        { status: HttpStatusCode.INTERNAL_SERVER_ERROR }
    );
}

// Utility to log errors with additional context
export function logApiError(error: unknown, context: Record<string, unknown> = {}) {
    if (error instanceof ApiError && !error.loggable) {
        return; // Skip logging for non-loggable errors
    }

    const errorObj = {
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : String(error),
        name: error instanceof Error ? error.name : 'UnknownError',
        stack: error instanceof Error ? error.stack : undefined,
        ...context,
    };

    // In production, you might want to send this to a logging service
    console.error('API Error Log:', JSON.stringify(errorObj, null, 2));
}

// Session type for auth
interface UserSession {
    user?: {
        id: string;
        name?: string;
        email?: string;
        role?: string;
        image?: string;
    };
    expires: string;
}

// Session validation helper
export function validateSession(session: UserSession | null, requiredRole?: string | string[]) {
    if (!session) {
        throw new UnauthorizedError('You must be signed in to access this resource');
    }

    if (requiredRole) {
        const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
        const userRole = session.user?.role;

        if (!userRole || !roles.includes(userRole)) {
            throw new ForbiddenError('You do not have permission to access this resource');
        }
    }

    return session;
}
