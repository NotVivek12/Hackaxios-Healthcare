import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import mongoose from 'mongoose';
import { analyzeSmsSymptoms } from '@/lib/ai/sms-analyzer';
import { detectLanguage, getMultilingualResponse, getAnalysisResponseText } from '@/lib/multilingual';

/**
 * SMS Webhook Endpoint
 * 
 * This endpoint handles incoming SMS messages from Twilio.
 * It provides AI-powered responses to health queries and symptom reports.
 * 
 * @param {NextRequest} request - The incoming webhook request from Twilio
 * @returns {NextResponse} XML response that Twilio can send back to the user
 */
export async function POST(request: NextRequest) {
    try {
        const formData = await request.formData();

        // Extract SMS data from Twilio webhook
        const from = formData.get('From') as string;
        const body = formData.get('Body') as string;
        const messageSid = formData.get('MessageSid') as string;

        if (!from || !body) {
            return new NextResponse(
                `<?xml version="1.0" encoding="UTF-8"?>
                <Response>
                    <Message>Error processing your message. Please try again.</Message>
                </Response>`,
                {
                    status: 400,
                    headers: {
                        'Content-Type': 'text/xml',
                    },
                }
            );
        }

        // Log incoming message
        console.log(`Received SMS from ${from}: ${body}`);

        // Connect to database
        await connectDB();
        const db = mongoose.connections[0].db;

        if (!db) {
            console.error('Failed to connect to MongoDB');
            return NextResponse.json({ error: 'Database connection failed' }, { status: 500 });
        }

        // Detect language of the message
        const detectedLanguage = detectLanguage(body);

        // Store the incoming message with detected language
        await db.collection('sms_messages').insertOne({
            from,
            body,
            messageSid,
            direction: 'inbound',
            timestamp: new Date(),
            language: detectedLanguage,
            processed: false
        });

        // Process commands or analyze symptoms
        let responseText = '';

        // Check for keywords/commands in various languages
        const normalizedBody = body.trim().toLowerCase();

        // Handle help command
        if (normalizedBody === 'help' || normalizedBody === 'ayuda' || normalizedBody === 'aide' ||
            normalizedBody === 'मदद' || normalizedBody === 'ajuda' || normalizedBody === 'msaada') {
            responseText = getMultilingualResponse('help', detectedLanguage);
        }
        // Handle stop command
        else if (normalizedBody === 'stop' || normalizedBody === 'parar' ||
            normalizedBody === 'arrêter' || normalizedBody === 'توقف' ||
            normalizedBody === 'रोक' || normalizedBody === 'simamisha') {
            responseText = getMultilingualResponse('stop', detectedLanguage);

            // Mark user as opted out
            await db.collection('users').updateOne(
                { phoneNumber: from },
                { $set: { smsOptOut: true, smsOptOutDate: new Date() } },
                { upsert: true }
            );
        }
        // Handle start command
        else if (normalizedBody === 'start' || normalizedBody === 'comenzar' ||
            normalizedBody === 'commencer' || normalizedBody === 'بدء' ||
            normalizedBody === 'शुरू' || normalizedBody === 'anza') {
            responseText = getMultilingualResponse('start', detectedLanguage);

            // Mark user as opted in
            await db.collection('users').updateOne(
                { phoneNumber: from },
                { $set: { smsOptOut: false, smsOptOutDate: null, preferredLanguage: detectedLanguage } },
                { upsert: true }
            );
        }
        // Handle appointment command
        else if (normalizedBody.startsWith('appointment') || normalizedBody.startsWith('cita') ||
            normalizedBody.startsWith('rendezvous') || normalizedBody.startsWith('موعد') ||
            normalizedBody.startsWith('नियुक्ति') || normalizedBody.startsWith('consulta') ||
            normalizedBody.startsWith('miadi')) {
            responseText = getMultilingualResponse('appointment', detectedLanguage);

            // Store appointment request
            await db.collection('appointment_requests').insertOne({
                phoneNumber: from,
                requestText: body,
                language: detectedLanguage,
                status: 'pending',
                createdAt: new Date()
            });
        }
        // Handle reminder command
        else if (normalizedBody.startsWith('reminder') || normalizedBody.startsWith('recordatorio') ||
            normalizedBody.startsWith('rappel') || normalizedBody.startsWith('تذكير') ||
            normalizedBody.startsWith('अनुस्मारक') || normalizedBody.startsWith('lembrete') ||
            normalizedBody.startsWith('ukumbusho')) {
            responseText = getMultilingualResponse('reminder', detectedLanguage);

            // Process reminder request (implementation simplified)
            await db.collection('medication_reminders').insertOne({
                phoneNumber: from,
                reminderText: body,
                language: detectedLanguage,
                status: 'active',
                createdAt: new Date()
            });
        }
        else {
            // Assume this is a symptom description, analyze with AI
            try {
                const analysis = await analyzeSmsSymptoms(body);

                // Generate multilingual response based on detected language
                responseText = getAnalysisResponseText(analysis, detectedLanguage);

                // Store the analysis
                await db.collection('symptom_analyses').insertOne({
                    phoneNumber: from,
                    messageText: body,
                    language: detectedLanguage,
                    analysis,
                    createdAt: new Date()
                });
            } catch (error) {
                console.error('Error analyzing symptoms via SMS:', error);

                // Fallback error message in the detected language
                switch (detectedLanguage) {
                    case 'es':
                        responseText = "No pudimos analizar correctamente sus síntomas. Proporcione más detalles sobre cómo se siente o responda HELP para ver otras opciones.";
                        break;
                    case 'fr':
                        responseText = "Nous n'avons pas pu analyser correctement vos symptômes. Veuillez fournir plus de détails sur votre état ou répondez HELP pour d'autres options.";
                        break;
                    case 'ar':
                        responseText = "لم نتمكن من تحليل أعراضك بشكل صحيح. يرجى تقديم المزيد من التفاصيل حول شعورك، أو الرد HELP للخيارات الأخرى.";
                        break;
                    case 'hi':
                        responseText = "हम आपके लक्षणों का ठीक से विश्लेषण नहीं कर सके। कृपया अपने महसूस के बारे में अधिक जानकारी दें, या अन्य विकल्पों के लिए HELP उत्तर दें।";
                        break;
                    case 'pt':
                        responseText = "Não conseguimos analisar corretamente seus sintomas. Forneça mais detalhes sobre como você está se sentindo ou responda HELP para outras opções.";
                        break;
                    case 'sw':
                        responseText = "Hatukuweza kuchambua dalili zako vizuri. Tafadhali toa maelezo zaidi kuhusu jinsi unavyohisi, au jibu HELP kwa chaguo zingine.";
                        break;
                    default: // English
                        responseText = "We couldn't properly analyze your symptoms. Please provide more details about how you're feeling, or reply HELP for other options.";
                }
            }
        }

        // Send response via Twilio XML format
        return new NextResponse(
            `<?xml version="1.0" encoding="UTF-8"?>
            <Response>
                <Message>${responseText}</Message>
            </Response>`,
            {
                status: 200,
                headers: {
                    'Content-Type': 'text/xml',
                },
            }
        );

    } catch (error) {
        console.error('SMS webhook error:', error);

        // Return a generic error message in Twilio's XML format
        return new NextResponse(
            `<?xml version="1.0" encoding="UTF-8"?>
            <Response>
                <Message>We apologize, but we couldn't process your message. Please try again later or contact support.</Message>
            </Response>`,
            {
                status: 500,
                headers: {
                    'Content-Type': 'text/xml',
                },
            }
        );
    }
}
