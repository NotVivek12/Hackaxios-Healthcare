import { AIAnalysis } from '@/lib/ai/symptom-analyzer';
import Groq from 'groq-sdk';

// Initialize Groq with better error checking
let groq: Groq | null = null;
try {
    // Get API key with explicit fallback
    const apiKey = process.env.GROQ_API_KEY?.trim();

    if (!apiKey) {
        console.warn('GROQ_API_KEY is not defined or empty. SMS AI features will use fallback responses.');
        throw new Error('Missing Groq API key');
    }

    groq = new Groq({ apiKey });
} catch (error) {
    console.error('Failed to initialize Groq client for SMS analyzer:', error);
    groq = null;
}

// Cache for SMS symptom analysis to prevent repeated API calls
interface CacheEntry {
    timestamp: number;
    analysis: AIAnalysis;
}

const smsAnalysisCache = new Map<string, CacheEntry>();
const CACHE_TTL = 1000 * 60 * 15; // 15 minute cache validity for SMS

/**
 * Analyze symptoms described in an SMS message
 * @param message The SMS message text to analyze
 * @returns An AIAnalysis object with the analysis results
 */
export async function analyzeSmsSymptoms(message: string): Promise<AIAnalysis> {
    // Generate a cache key based on the message content
    // Normalize and simplify to improve cache hits
    const cacheKey = message.toLowerCase().trim();

    // Check cache
    const cachedResult = smsAnalysisCache.get(cacheKey);
    if (cachedResult && (Date.now() - cachedResult.timestamp) < CACHE_TTL) {
        console.log('Using cached SMS symptom analysis result');
        return { ...cachedResult.analysis };
    }

    try {
        // Optimize prompt for SMS context (shorter messages)
        const prompt = `Analyze this SMS message for health symptoms: "${message}"

Return ONLY JSON with this structure:
{
  "riskLevel": "low|medium|high|critical",
  "recommendations": ["recommendation1", "recommendation2"],
  "possibleConditions": [
    {
      "condition": "condition name",
      "probability": number_between_0_and_100,
      "description": "brief description"
    }
  ],
  "urgency": "routine|urgent|emergency",
  "followUpIn": "specific timeframe recommendation"
}

Remember to be concise as this is for SMS.`;

        // Try to use AI models
        try {
            if (!groq) throw new Error('Groq client not initialized');
            const completion = await groq.chat.completions.create({
                model: "llama-3.1-8b-instant", // Use fast Groq model for SMS
                messages: [
                    {
                        role: "system",
                        content: "You are a medical AI assistant analyzing symptoms from SMS messages. Provide concise analysis in valid JSON only."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.3,
                max_tokens: 500
            });

            const response = completion.choices[0]?.message?.content;

            if (response) {
                try {
                    // Parse JSON response
                    const cleanJson = response.replace(/```json|```/g, '').trim();
                    const analysis = JSON.parse(cleanJson) as AIAnalysis;

                    // Validate structure
                    if (!analysis.riskLevel ||
                        !analysis.recommendations || !Array.isArray(analysis.recommendations) ||
                        !analysis.possibleConditions || !Array.isArray(analysis.possibleConditions) ||
                        !analysis.urgency) {
                        throw new Error('Invalid AI response structure');
                    }

                    // Cache the result
                    smsAnalysisCache.set(cacheKey, {
                        timestamp: Date.now(),
                        analysis: { ...analysis }
                    });

                    return analysis;
                } catch (jsonError) {
                    console.error('Error parsing SMS analysis JSON:', jsonError);
                    // Continue to fallback
                }
            }
        } catch (aiError) {
            console.error('Error using Groq for SMS analysis:', aiError);
            // Continue to fallback
        }

        // Fallback analysis - simpler for SMS
        return generateSmsFallbackAnalysis(message);

    } catch (error) {
        console.error('Error analyzing SMS symptoms:', error);
        return generateSmsFallbackAnalysis(message);
    }
}

/**
 * Generate a fallback analysis when AI is unavailable
 * Simplified version for SMS context
 */
function generateSmsFallbackAnalysis(message: string): AIAnalysis {
    // Simple keyword-based analysis for fallback
    const lowerMessage = message.toLowerCase();

    // Check for emergency keywords
    const emergencyKeywords = [
        'chest pain', 'difficulty breathing', 'shortness of breath', 'severe headache',
        'stroke', 'seizure', 'unconscious', 'unresponsive', 'paralysis',
        'severe bleeding', 'suicide', 'emergency'
    ];

    // Check for moderate concern keywords
    const moderateKeywords = [
        'fever', 'vomiting', 'diarrhea', 'infection', 'pain', 'cough',
        'headache', 'dizzy', 'rash', 'swelling'
    ];

    // Determine risk level
    let riskLevel: 'low' | 'medium' | 'high' | 'critical' = 'low';
    let urgency: 'routine' | 'urgent' | 'emergency' = 'routine';

    // Check for emergency conditions
    if (emergencyKeywords.some(keyword => lowerMessage.includes(keyword))) {
        riskLevel = 'high';
        urgency = 'urgent';

        // Double-check for critical combinations
        if (['chest pain', 'breathing', 'unconscious', 'stroke', 'suicide'].some(critical =>
            lowerMessage.includes(critical))) {
            riskLevel = 'critical';
            urgency = 'emergency';
        }
    }
    // Check for moderate concerns
    else if (moderateKeywords.some(keyword => lowerMessage.includes(keyword))) {
        riskLevel = 'medium';

        // Check for duration indicators
        if (lowerMessage.includes('days') || lowerMessage.includes('week')) {
            urgency = 'urgent';
        }
    }

    // Generate recommendations
    const recommendations = [
        'Consult with a healthcare professional',
        'Monitor your symptoms and note any changes'
    ];

    if (riskLevel === 'critical') {
        recommendations.unshift('Seek immediate medical attention');
    } else if (riskLevel === 'high') {
        recommendations.unshift('Contact a healthcare provider promptly');
    }

    // Generate possible conditions (simplified for SMS)
    const possibleConditions = [];

    if (lowerMessage.includes('headache')) {
        possibleConditions.push({
            condition: 'Tension Headache',
            probability: 40,
            description: 'Common headache with mild to moderate pain'
        });
    }

    if (lowerMessage.includes('fever')) {
        possibleConditions.push({
            condition: 'Viral Infection',
            probability: 45,
            description: 'Common viral infection with fever'
        });
    }

    if (lowerMessage.includes('cough')) {
        possibleConditions.push({
            condition: 'Upper Respiratory Infection',
            probability: 35,
            description: 'Infection affecting airways'
        });
    }

    // Add a generic condition if none were detected
    if (possibleConditions.length === 0) {
        possibleConditions.push({
            condition: 'General Health Concern',
            probability: 30,
            description: 'Various potential causes for your symptoms'
        });
    }

    // Determine follow-up recommendation
    let followUpIn = 'within 1-2 weeks';
    if (urgency === 'emergency') {
        followUpIn = 'immediate medical attention required';
    } else if (urgency === 'urgent') {
        followUpIn = 'within 24-48 hours';
    }

    return {
        riskLevel,
        recommendations,
        possibleConditions,
        urgency,
        followUpIn
    };
}

/**
 * Clean up expired cache entries periodically
 */
function cleanupSmsCache() {
    const now = Date.now();

    for (const [key, entry] of smsAnalysisCache.entries()) {
        if (now - entry.timestamp > CACHE_TTL) {
            smsAnalysisCache.delete(key);
        }
    }
}

// Run cache cleanup every 30 minutes
if (typeof setInterval !== 'undefined') {
    setInterval(cleanupSmsCache, 30 * 60 * 1000);
}
