import Groq from 'groq-sdk';

// Simple in-memory cache for symptom analysis results
// This helps prevent repeated expensive API calls for similar symptoms
interface CacheEntry {
    timestamp: number;
    analysis: AIAnalysis;
}

const analysisCache: Map<string, CacheEntry> = new Map();
const CACHE_TTL = 1000 * 60 * 60; // 1 hour cache validity

// Initialize Groq with better error checking
let groq: Groq | null = null;
try {
    // Get API key with explicit fallback
    const apiKey = process.env.GROQ_API_KEY?.trim();

    if (!apiKey) {
        console.warn('GROQ_API_KEY is not defined or empty. AI features will use fallback responses.');
        throw new Error('Missing Groq API key');
    }

    groq = new Groq({ apiKey });
} catch (error) {
    console.error('Failed to initialize Groq client:', error);
    // Create a dummy client that will throw controlled errors for easier debugging
    groq = null;
}

export interface SymptomInput {
    name: string;
    severity: 'mild' | 'moderate' | 'severe';
    duration: string;
    description?: string;
}

export interface AIAnalysis {
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    recommendations: string[];
    possibleConditions: {
        condition: string;
        probability: number;
        description: string;
    }[];
    urgency: 'routine' | 'urgent' | 'emergency';
    followUpIn?: string; // Optional field for follow-up recommendation time
    telemetry?: {
        responseTime?: number;
        modelUsed?: string;
        tokensUsed?: number;
        fallbackUsed?: boolean;
        error?: string;
        cached?: boolean;
    };
}

// List of symptoms that might indicate serious conditions requiring immediate attention
const EMERGENCY_SYMPTOMS = [
    'chest pain', 'difficulty breathing', 'shortness of breath', 'severe headache',
    'stroke', 'seizure', 'unconscious', 'unresponsive', 'paralysis',
    'severe bleeding', 'coughing blood', 'vomiting blood', 'sudden vision loss',
    'sudden numbness', 'severe abdominal pain', 'head injury', 'broken bone',
    'high fever', 'suicide', 'self harm', 'overdose', 'poisoning',
    'anaphylaxis', 'allergic reaction', 'heart attack', 'cardiac'
];

// Pre-computed single-word emergency terms for even faster checks
const EMERGENCY_SINGLE_WORDS = new Set(
    EMERGENCY_SYMPTOMS.flatMap(term => term.split(/\s+/))
        .filter(word => word.length > 3) // Skip very short words
);

/**
 * Checks symptoms for potential emergency conditions
 * @param symptoms List of symptom inputs to check
 * @returns boolean indicating if emergency symptoms are present
 */
function hasEmergencySymptoms(symptoms: SymptomInput[]): boolean {
    // Quick check: if no severe symptoms, this can't be an emergency
    if (!symptoms.some(s => s.severity === 'severe')) {
        return false;
    }

    // Create a combined text for faster search
    const combinedText = symptoms
        .map(s => `${s.name.toLowerCase()} ${s.description?.toLowerCase() || ''}`)
        .join(' ');

    // First check: look for single emergency words (faster)
    const words = combinedText.split(/\s+/);
    for (const word of words) {
        if (EMERGENCY_SINGLE_WORDS.has(word)) {
            return true;
        }
    }

    // Second check: look for multi-word emergency terms
    for (const term of EMERGENCY_SYMPTOMS) {
        if (combinedText.includes(term)) {
            return true;
        }
    }

    return false;
}

/**
 * Generates a cache key for a set of symptoms
 */
function generateCacheKey(symptoms: SymptomInput[]): string {
    // Sort symptoms to ensure consistent keys regardless of order
    return JSON.stringify(
        [...symptoms].sort((a, b) => a.name.localeCompare(b.name))
    );
}

export async function analyzeSymptoms(symptoms: SymptomInput[]): Promise<AIAnalysis> {
    const startTime = Date.now();
    const telemetry: AIAnalysis['telemetry'] = {
        fallbackUsed: false
    };

    // Check for emergency symptoms first - this bypasses the cache for safety
    const emergencyDetected = hasEmergencySymptoms(symptoms);
    if (emergencyDetected) {
        console.warn('Emergency symptoms detected - providing immediate emergency guidance');
        return createEmergencyResponse(symptoms, telemetry);
    }

    // Check cache for similar symptom analysis
    const cacheKey = generateCacheKey(symptoms);
    const cachedResult = analysisCache.get(cacheKey);

    if (cachedResult && (Date.now() - cachedResult.timestamp) < CACHE_TTL) {
        console.log('Using cached symptom analysis result');
        const analysis = { ...cachedResult.analysis };
        if (!analysis.telemetry) analysis.telemetry = {};
        analysis.telemetry.cached = true;
        analysis.telemetry.responseTime = Date.now() - startTime;
        return analysis;
    }

    try {
        // Create a more compact symptom description to reduce token usage
        const symptomDescription = symptoms.map(s =>
            `${s.name} (${s.severity} severity, duration: ${s.duration})${s.description ? ': ' + s.description : ''}`
        ).join('; ');

        // More concise prompt to reduce token usage and improve response time
        const prompt = `Analyze these symptoms: ${symptomDescription}

Return ONLY JSON with this structure:
{
  "riskLevel": "low|medium|high|critical",
  "recommendations": ["recommendation1", "recommendation2", ...],
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

Remember: This is for informational purposes only, not professional medical advice.`;

        // Try to use AI models if available, with proper error handling
    let completion: Awaited<ReturnType<Groq['chat']['completions']['create']>> | null = null;
        const isDevEnv = process.env.NODE_ENV === 'development';

        // Use the fastest available model first - GPT-3.5-turbo
        // Only escalate to GPT-4 for complex cases to improve performance
    const needsAdvancedModel = symptoms.length > 3 || symptoms.some(s => s.severity === 'severe');
    // Map to Groq models
    const fastModel = 'llama-3.1-8b-instant';
    const strongModel = 'mixtral-8x7b-32768';
    const preferredModel = (!isDevEnv && needsAdvancedModel) ? strongModel : fastModel;

        try {
            if (!groq) throw new Error('Groq client not initialized');
            completion = await groq.chat.completions.create({
                model: preferredModel,
                messages: [
                    {
                        role: "system",
                        content: "You are a medical AI assistant. Provide symptom analysis in valid JSON only."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.2,
                max_tokens: 800
            });

            telemetry.modelUsed = preferredModel;
            telemetry.tokensUsed = completion?.usage?.total_tokens;

        } catch (error) {
            console.log("Failed to use preferred model, using fallback:", error instanceof Error ? error.message : String(error));

            const errorMsg = error instanceof Error ? error.message : String(error);
            telemetry.error = errorMsg;

            // If the preferred model was GPT-4, try GPT-3.5
            if (preferredModel === strongModel) {
                try {
                    if (!groq) throw new Error('Groq client not initialized');
                    completion = await groq.chat.completions.create({
                        model: fastModel,
                        messages: [
                            {
                                role: "system",
                                content: "You are a medical AI assistant. Provide symptom analysis in valid JSON only."
                            },
                            {
                                role: "user",
                                content: prompt
                            }
                        ],
                        temperature: 0.3,
                        max_tokens: 800
                    });

                    telemetry.modelUsed = fastModel;
                    telemetry.tokensUsed = completion?.usage?.total_tokens;

                } catch (fallbackError) {
                    console.log("Failed to use fallback model, using local analysis:",
                        fallbackError instanceof Error ? fallbackError.message : String(fallbackError));
                    telemetry.error += "; " + (fallbackError instanceof Error ? fallbackError.message : String(fallbackError));
                    telemetry.fallbackUsed = true;
                }
            } else {
                // Both models failed or we started with GPT-3.5 and it failed
                console.log("No available AI models could be used, falling back to local analysis");
                telemetry.error = telemetry.error || "All AI models failed";
                telemetry.fallbackUsed = true;
            }
        }

        // Process AI response if we got one, otherwise use fallback
        if (completion && completion.choices && completion.choices.length > 0) {
            const response = completion.choices[0]?.message?.content as string | null;
            if (response) {
                // Parse the JSON response with better error handling
                try {
                    // First, clean up the response if it's not proper JSON
                    const cleanJson = response.replace(/```json|```/g, '').trim();
                    const analysis = JSON.parse(cleanJson) as AIAnalysis;

                    // Validate the response structure
                    if (!analysis.riskLevel ||
                        !analysis.recommendations || !Array.isArray(analysis.recommendations) ||
                        !analysis.possibleConditions || !Array.isArray(analysis.possibleConditions) ||
                        !analysis.urgency) {
                        throw new Error('Invalid AI response: missing required fields');
                    }

                    // Add telemetry data
                    analysis.telemetry = telemetry;
                    analysis.telemetry.responseTime = Date.now() - startTime;

                    // Store result in cache
                    analysisCache.set(cacheKey, {
                        timestamp: Date.now(),
                        analysis: { ...analysis }
                    });

                    // If we got here, the AI response is valid
                    return analysis;
                } catch (jsonError) {
                    console.error('Error parsing Groq JSON response:', jsonError);
                    telemetry.error = `JSON parsing error: ${jsonError instanceof Error ? jsonError.message : String(jsonError)}`;
                    // We'll continue to the fallback response
                }
            } else {
                console.log('Empty response from AI, using fallback');
                telemetry.error = 'Empty response from AI';
            }
        } else {
            console.log('No AI completion available, using fallback response');
            telemetry.error = 'No AI completion available';
        }

        // At this point, we need to use the fallback - generate it now
        telemetry.fallbackUsed = true;
        telemetry.responseTime = Date.now() - startTime;

        const fallbackAnalysis = generateFallbackAnalysis(symptoms, telemetry);

        // Cache the fallback response too to avoid repeated failures
        analysisCache.set(cacheKey, {
            timestamp: Date.now(),
            analysis: { ...fallbackAnalysis }
        });

        return fallbackAnalysis;
    } catch (error) {
        console.error('Error analyzing symptoms:', error);

        // Log more detail about the error
        telemetry.fallbackUsed = true;
        telemetry.responseTime = Date.now() - startTime;
        telemetry.error = error instanceof Error ? `${error.name}: ${error.message}` : String(error);

        const fallbackAnalysis = generateFallbackAnalysis(symptoms, telemetry);

        // Cache the fallback response too
        analysisCache.set(cacheKey, {
            timestamp: Date.now(),
            analysis: { ...fallbackAnalysis }
        });

        return fallbackAnalysis;
    }
}

/**
 * Creates an emergency response when severe symptoms are detected
 */
function createEmergencyResponse(symptoms: SymptomInput[], telemetry?: AIAnalysis['telemetry']): AIAnalysis {
    // Generate emergency recommendations based on symptoms
    const recommendations = [
        'Seek immediate medical attention or call emergency services',
        'Do not delay seeking professional medical help',
        'Inform emergency responders about all your symptoms and their duration',
        'If possible, have someone stay with you until medical help arrives'
    ];

    // Add specific guidance based on symptoms
    const symptomNames = symptoms.map(s => s.name.toLowerCase());

    if (symptomNames.some(s => s.includes('chest') && s.includes('pain'))) {
        recommendations.push('Sit down, rest, and try to remain calm while awaiting emergency services');
        recommendations.push('If available and prescribed to you, consider taking aspirin unless allergic');
    }

    if (symptomNames.some(s => s.includes('breath'))) {
        recommendations.push('Try to remain calm and take slow, steady breaths if possible');
        recommendations.push('Sit upright to help ease breathing if possible');
    }

    if (symptomNames.some(s => s.includes('bleed'))) {
        recommendations.push('Apply direct pressure to any visible bleeding sites using a clean cloth');
        recommendations.push('Elevate the injured area if possible');
    }

    // Generate emergency conditions based on symptoms
    const possibleConditions = [];

    if (symptomNames.some(s => s.includes('chest') && s.includes('pain'))) {
        possibleConditions.push({
            condition: 'Possible Cardiac Event',
            probability: 70,
            description: 'Chest pain can indicate serious cardiac conditions requiring immediate medical attention'
        });
    }

    if (symptomNames.some(s => s.includes('breath'))) {
        possibleConditions.push({
            condition: 'Respiratory Distress',
            probability: 75,
            description: 'Difficulty breathing may indicate several serious conditions requiring immediate medical care'
        });
    }

    if (symptomNames.some(s => s.includes('head') && (s.includes('pain') || s.includes('ache')))) {
        possibleConditions.push({
            condition: 'Severe Headache Condition',
            probability: 65,
            description: 'Sudden severe headache could indicate serious neurological issues requiring immediate evaluation'
        });
    }

    // Add a general condition if no specific ones were added
    if (possibleConditions.length === 0) {
        possibleConditions.push({
            condition: 'Acute Medical Condition',
            probability: 80,
            description: 'Your symptoms suggest a potentially serious medical condition requiring immediate evaluation'
        });
    }

    return {
        riskLevel: 'critical',
        recommendations,
        possibleConditions,
        urgency: 'emergency',
        followUpIn: 'immediate medical attention required',
        telemetry
    };
}

/**
 * Generates a fallback analysis when AI is unavailable
 */
function generateFallbackAnalysis(symptoms: SymptomInput[], telemetry?: AIAnalysis['telemetry']): AIAnalysis {
    // Get all symptom names in lowercase for quicker matching
    const symptomNames = symptoms.map(s => s.name.toLowerCase());

    // Use a lookup map for faster symptom checking (O(1) instead of O(n))
    const symptomMap = new Map<string, boolean>();
    symptomNames.forEach(name => {
        // Add common variations and related terms for each symptom
        const words = name.split(/\s+/);
        words.forEach(word => symptomMap.set(word, true));
        symptomMap.set(name, true);
    });

    // Helper function for faster symptom checking
    const hasSymptom = (term: string): boolean => {
        return symptomMap.has(term) ||
            symptomNames.some(s => s.includes(term));
    };

    const hasHeadache = hasSymptom('head') || hasSymptom('migraine');
    const hasFever = hasSymptom('fever') || hasSymptom('temperature');
    const hasCough = hasSymptom('cough');
    const hasStomach = hasSymptom('stomach') || hasSymptom('nausea') || hasSymptom('vomit');
    const hasJointPain = hasSymptom('joint') || hasSymptom('pain') || hasSymptom('ache');
    const hasSkinIssue = hasSymptom('rash') || hasSymptom('itch') || hasSymptom('skin');
    const hasThroatIssue = hasSymptom('throat') || hasSymptom('swallow');
    const hasEyeIssue = hasSymptom('eye') || hasSymptom('vision');

    // Determine risk level based on severity
    const highestSeverity = symptoms.reduce((highest, current) => {
        const severityMap = { 'mild': 1, 'moderate': 2, 'severe': 3 };
        return Math.max(highest, severityMap[current.severity] || 1);
    }, 1);

    const riskLevel = highestSeverity === 3 ? 'high' : highestSeverity === 2 ? 'medium' : 'low';

    // Generate relevant recommendations
    const recommendations = [
        'Consult with a healthcare professional for proper diagnosis',
        'Monitor your symptoms and note any changes'
    ];

    if (highestSeverity >= 2) {
        recommendations.push('Seek medical attention if symptoms worsen');
    }

    if (hasFever) {
        recommendations.push('Stay hydrated and monitor temperature');
    }

    if (hasHeadache) {
        recommendations.push('Rest in a quiet, dark room if experiencing headache');
    }

    if (hasCough) {
        recommendations.push('Stay hydrated and consider using a humidifier');
    }

    if (hasStomach) {
        recommendations.push('Stick to a bland diet and stay hydrated');
    }

    if (hasJointPain) {
        recommendations.push('Rest the affected area and consider over-the-counter pain relievers if appropriate');
    }

    if (hasSkinIssue) {
        recommendations.push('Avoid scratching and irritating the affected area');
    }

    if (hasThroatIssue) {
        recommendations.push('Stay hydrated and consider soothing lozenges if appropriate');
    }

    if (hasEyeIssue) {
        recommendations.push('Avoid straining your eyes and consider using artificial tears if appropriate');
    }

    // Generate contextual possible conditions
    const possibleConditions = [];

    if (hasHeadache) {
        possibleConditions.push({
            condition: 'Tension Headache',
            probability: 35,
            description: 'Common headache with mild to moderate pain, often described as a tight band around the head.'
        });
        possibleConditions.push({
            condition: 'Migraine',
            probability: 25,
            description: 'Recurring headache disorder causing moderate to severe pain, often with sensitivity to light and sound.'
        });
    }

    if (hasFever) {
        possibleConditions.push({
            condition: 'Common Viral Infection',
            probability: 40,
            description: 'Viral infection that causes fever, fatigue, and general discomfort.'
        });
    }

    if (hasCough) {
        possibleConditions.push({
            condition: 'Upper Respiratory Infection',
            probability: 30,
            description: 'Infection affecting the nasal passages, throat, and airways, causing cough and congestion.'
        });
    }

    if (hasStomach) {
        possibleConditions.push({
            condition: 'Gastroenteritis',
            probability: 25,
            description: 'Inflammation of the stomach and intestines, causing nausea, vomiting, and abdominal pain.'
        });
    }

    if (hasJointPain) {
        possibleConditions.push({
            condition: 'Musculoskeletal Strain',
            probability: 20,
            description: 'Injury to muscles or tendons causing pain and inflammation.'
        });
    }

    if (hasSkinIssue) {
        possibleConditions.push({
            condition: 'Contact Dermatitis',
            probability: 25,
            description: 'Skin inflammation caused by contact with allergens or irritants.'
        });
    }

    if (hasThroatIssue) {
        possibleConditions.push({
            condition: 'Pharyngitis',
            probability: 30,
            description: 'Inflammation of the pharynx, causing sore throat and discomfort when swallowing.'
        });
    }

    if (hasEyeIssue) {
        possibleConditions.push({
            condition: 'Conjunctivitis',
            probability: 25,
            description: 'Inflammation of the conjunctiva, causing redness, itching, and discharge.'
        });
    }

    // Add general conditions if specific ones aren't identified
    if (possibleConditions.length === 0) {
        possibleConditions.push({
            condition: 'Common Cold',
            probability: 30,
            description: 'Viral infection causing nasal congestion, sore throat, and mild fever.'
        });
        possibleConditions.push({
            condition: 'Stress-Related Condition',
            probability: 25,
            description: 'Physical symptoms triggered by psychological stress, including headaches and fatigue.'
        });
        possibleConditions.push({
            condition: 'Seasonal Allergies',
            probability: 20,
            description: 'Immune response to environmental triggers causing various symptoms.'
        });
    }

    // Determine urgency based on severity and symptoms
    let urgency: 'routine' | 'urgent' | 'emergency' = 'routine';
    if (highestSeverity === 3) {
        urgency = 'urgent';
    }
    if (symptoms.some(s => s.duration.includes('week') || s.duration.includes('month'))) {
        urgency = 'urgent';
    }
    // Emergency conditions
    if (symptoms.some(s =>
        s.severity === 'severe' &&
        (s.name.toLowerCase().includes('breath') || s.name.toLowerCase().includes('chest pain'))
    )) {
        urgency = 'emergency';
    }

    // Determine follow-up recommendation
    let followUpIn = 'within 1-2 weeks';
    if (urgency === 'emergency') {
        followUpIn = 'immediate medical attention required';
    } else if (urgency === 'urgent') {
        followUpIn = 'within 24-48 hours';
    } else if (riskLevel === 'low') {
        followUpIn = 'within 2-3 weeks if symptoms persist';
    }

    return {
        riskLevel: riskLevel as 'low' | 'medium' | 'high' | 'critical',
        recommendations,
        possibleConditions,
        urgency,
        followUpIn,
        telemetry
    };
}

// Create a static in-memory cache for health advice
const healthAdviceCache = new Map<string, { timestamp: number, advice: string }>();
const HEALTH_ADVICE_CACHE_TTL = 1000 * 60 * 60 * 24; // 24 hour cache

export async function generateHealthAdvice(condition: string, language: string = 'en'): Promise<string> {
    // Generate a cache key for health advice
    const cacheKey = `health_advice_${condition.toLowerCase()}_${language}`;
    const cachedItem = healthAdviceCache.get(cacheKey);

    // Return cached advice if available and not expired
    if (cachedItem && (Date.now() - cachedItem.timestamp) < HEALTH_ADVICE_CACHE_TTL) {
        return cachedItem.advice;
    }

    try {
        // Keep prompt shorter for better performance
        const prompt = `Brief health advice for ${condition} in ${language}. Emphasize consulting medical professionals. Max 150 words.`;

        // Try to use OpenAI API with proper error handling
        try {
            if (!groq) throw new Error('Groq client not initialized');
            const completion = await groq.chat.completions.create({
                model: "llama-3.1-8b-instant",
                messages: [
                    {
                        role: "system",
                        content: "You are a helpful health information assistant. Always remind users to consult healthcare professionals."
                    },
                    {
                        role: "user",
                        content: prompt
                    }
                ],
                temperature: 0.5,
                max_tokens: 200,
            });

            const advice = completion.choices[0]?.message?.content || 'Please consult a healthcare professional for personalized advice.';

            // Cache the advice
            healthAdviceCache.set(cacheKey, {
                timestamp: Date.now(),
                advice
            });

            return advice;
        } catch (error) {
            console.error('Error using Groq for health advice:', error);

            // Generate fallback advice based on the condition
            let fallbackAdvice = '';

            if (language === 'en') {
                fallbackAdvice = `For ${condition}, it's important to monitor your symptoms and consult with a healthcare provider. 
                Rest appropriately, stay hydrated, and follow any treatment plans previously prescribed by your doctor. 
                Keep track of any changes in your symptoms, especially if they worsen. 
                Remember that this is general advice and not a substitute for professional medical consultation.`;
            } else {
                // Simple fallback for non-English languages
                fallbackAdvice = 'Please consult a healthcare professional for personalized advice.';
            }

            // Cache the fallback advice
            healthAdviceCache.set(cacheKey, {
                timestamp: Date.now(),
                advice: fallbackAdvice
            });

            return fallbackAdvice;
        }
    } catch (error) {
        console.error('Error generating health advice:', error);
        return 'Please consult a healthcare professional for personalized advice.';
    }
}

/**
 * Cleans up expired cache entries to prevent memory leaks
 */
function cleanupCache() {
    const now = Date.now();

    // Clean symptom analysis cache
    for (const [key, entry] of analysisCache.entries()) {
        if (now - entry.timestamp > CACHE_TTL) {
            analysisCache.delete(key);
        }
    }

    // Clean health advice cache
    for (const [key, entry] of healthAdviceCache.entries()) {
        if (now - entry.timestamp > HEALTH_ADVICE_CACHE_TTL) {
            healthAdviceCache.delete(key);
        }
    }
}

// Run cache cleanup periodically (every 30 minutes)
if (typeof setInterval !== 'undefined') {
    setInterval(cleanupCache, 30 * 60 * 1000);
}
