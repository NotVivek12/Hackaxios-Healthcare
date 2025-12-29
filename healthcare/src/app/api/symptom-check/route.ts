import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/auth';
import connectDB from '@/lib/mongodb';
import SymptomCheck from '@/models/SymptomCheck';
import { analyzeSymptoms, type SymptomInput, type AIAnalysis } from '@/lib/ai/symptom-analyzer';
import { BadRequestError, handleApiError, logApiError } from '@/lib/api-error';
import { z } from 'zod';

// Simple in-memory cache to improve performance for symptom checks
const SYMPTOM_CHECK_CACHE_TTL = 5 * 60 * 1000; // 5 minutes cache lifetime
interface CachedAnalysis {
    timestamp: number;
    analysis: AIAnalysis;
}
const symptomCheckCache = new Map<string, CachedAnalysis>();

// Validation schema for symptom check request
const SymptomInputSchema = z.object({
    name: z.string().min(1, 'Symptom name is required'),
    severity: z.enum(['mild', 'moderate', 'severe']),
    duration: z.string().min(1, 'Duration is required'),
    description: z.string().optional(),
});

const SymptomCheckSchema = z.object({
    symptoms: z.array(SymptomInputSchema).nonempty({
        message: 'At least one symptom is required',
    }),
});

/**
 * Generate a cache key for symptom check requests
 */
function generateCacheKey(symptoms: SymptomInput[]): string {
    return JSON.stringify(
        [...symptoms].map(s => ({
            name: s.name.toLowerCase(),
            severity: s.severity,
            duration: s.duration,
            description: s.description || ''
        })).sort((a, b) => a.name.localeCompare(b.name))
    );
}

/**
 * Symptom Check API Endpoint
 * 
 * This endpoint analyzes symptoms using AI and provides health recommendations.
 * If the user is authenticated, the analysis is saved to their health record.
 * Uses caching to improve performance for similar symptom checks.
 * 
 * @param {NextRequest} request - The incoming request with symptoms data
 * @returns {NextResponse} Analysis results and recommendations
 */
export async function POST(request: NextRequest) {
    const startTime = Date.now();

    try {
        // Get user session (optional - users can check symptoms without logging in)
        const session = await getServerSession(authOptions);

        // Parse and validate request body
        const requestData = await request.json().catch(() => ({}));
        const validationResult = SymptomCheckSchema.safeParse(requestData);

        if (!validationResult.success) {
            throw new BadRequestError(
                'Invalid symptom data',
                'INVALID_SYMPTOMS',
                validationResult.error.format()
            );
        }

        const { symptoms } = validationResult.data;

        // Check cache first to avoid unnecessary AI processing
        const cacheKey = generateCacheKey(symptoms);
        const cachedResult = symptomCheckCache.get(cacheKey);

        if (cachedResult && (Date.now() - cachedResult.timestamp) < SYMPTOM_CHECK_CACHE_TTL) {
            console.info('Using cached symptom analysis result');

            // If user is logged in, still save to DB but don't wait for response
            if (session?.user) {
                connectDB().then(() => {
                    const symptomCheck = new SymptomCheck({
                        userId: session.user.id,
                        symptoms,
                        aiAnalysis: cachedResult.analysis,
                        status: 'completed',
                        createdAt: new Date(),
                        fromCache: true
                    });

                    symptomCheck.save()
                        .then(() => console.info(`Cached symptom check saved for user: ${session.user.id}`))
                        .catch((err: Error) => console.error('Error saving cached symptom check:', err));
                });
            }

            // Return cached result immediately
            return NextResponse.json({
                analysis: cachedResult.analysis,
                message: 'Symptoms analyzed successfully (cached)',
                timestamp: new Date().toISOString(),
                responseTime: Date.now() - startTime
            });
        }

        // Log symptom check for analytics (privacy-preserving)
        console.info(`Symptom check requested with ${symptoms.length} symptoms${session?.user ? ' by authenticated user' : ''}`);

        // Analyze symptoms using AI
        let analysis;
        try {
            analysis = await analyzeSymptoms(symptoms);
            console.info('Symptom analysis completed successfully');

            // Store in cache for future requests
            symptomCheckCache.set(cacheKey, {
                timestamp: Date.now(),
                analysis
            });
        } catch (error) {
            // Log the error but don't fail the request
            console.error('Error analyzing symptoms:', error);

            // Create a fallback analysis
            analysis = {
                riskLevel: 'medium',
                recommendations: [
                    'We were unable to provide a detailed analysis at this time',
                    'Please consult with a healthcare professional for proper diagnosis',
                    'Monitor your symptoms and seek immediate medical attention if they worsen'
                ],
                possibleConditions: [
                    {
                        condition: 'Unspecified Condition',
                        probability: 100,
                        description: 'Our system was unable to analyze your symptoms. Please consult with a healthcare professional.'
                    }
                ],
                urgency: 'urgent',
                followUpIn: 'as soon as possible'
            };
        }

        // Save to database if user is logged in
        if (session?.user) {
            await connectDB();

            const symptomCheck = new SymptomCheck({
                userId: session.user.id,
                symptoms,
                aiAnalysis: analysis,
                status: 'completed',
                createdAt: new Date()
            });

            await symptomCheck.save();

            // Log successful save for audit trail
            console.info(`Symptom check saved for user: ${session.user.id}`);
        }

        return NextResponse.json({
            analysis,
            message: 'Symptoms analyzed successfully',
            timestamp: new Date().toISOString(),
            responseTime: Date.now() - startTime
        });

    } catch (error) {
        // Log the error with context
        logApiError(error, {
            endpoint: '/api/symptom-check',
            method: 'POST',
            userAgent: request.headers.get('user-agent') || 'unknown'
        });

        // Return standardized error response
        return handleApiError(error);
    }
}

// Ensure Node.js runtime for compatibility with NextAuth session lookup
export const runtime = 'nodejs';
