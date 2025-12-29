/**
 * Detects the language of a text message
 * 
 * Simple implementation that checks for language-specific keywords.
 * In a production environment, you would use a more sophisticated
 * language detection library or API.
 */
export function detectLanguage(text: string): string {
    const normalizedText = text.toLowerCase();

    // Spanish keywords
    if (/\b(hola|gracias|ayuda|como|estar|salud|dolor|medicina|enfermedad)\b/.test(normalizedText)) {
        return 'es';
    }

    // French keywords
    if (/\b(bonjour|merci|aide|comment|santé|douleur|médecine|maladie)\b/.test(normalizedText)) {
        return 'fr';
    }

    // Arabic keywords - simplistic check for Arabic Unicode character range
    if (/[\u0600-\u06FF]/.test(normalizedText)) {
        return 'ar';
    }

    // Hindi keywords - simplistic check for Devanagari Unicode character range
    if (/[\u0900-\u097F]/.test(normalizedText)) {
        return 'hi';
    }

    // Portuguese keywords
    if (/\b(olá|obrigado|ajuda|como|saúde|dor|medicina|doença)\b/.test(normalizedText)) {
        return 'pt';
    }

    // Swahili keywords
    if (/\b(jambo|asante|msaada|afya|maumivu|dawa|ugonjwa)\b/.test(normalizedText)) {
        return 'sw';
    }

    // Default to English
    return 'en';
}

/**
 * Gets multilingual response for common SMS commands
 */
export function getMultilingualResponse(command: string, language = 'en'): string {
    const responses: Record<string, Record<string, string>> = {
        'help': {
            'en': 'Available commands:\n- SYMPTOM: Describe your symptoms\n- APPOINTMENT: Request a telemedicine appointment\n- REMINDER: Set medication reminder\n- STOP: Unsubscribe from messages',
            'es': 'Comandos disponibles:\n- SINTOMA: Describa sus síntomas\n- CITA: Solicitar una cita de telemedicina\n- RECORDATORIO: Establecer recordatorio de medicación\n- STOP: Cancelar suscripción',
            'fr': 'Commandes disponibles:\n- SYMPTOME: Décrivez vos symptômes\n- RENDEZVOUS: Demander une consultation de télémédecine\n- RAPPEL: Définir un rappel de médicament\n- STOP: Se désabonner',
            'ar': 'الأوامر المتاحة:\n- أعراض: وصف الأعراض\n- موعد: طلب استشارة طبية عن بعد\n- تذكير: ضبط تذكير بالدواء\n- توقف: إلغاء الاشتراك',
            'hi': 'उपलब्ध कमांड:\n- लक्षण: अपने लक्षणों का वर्णन करें\n- नियुक्ति: टेलीमेडिसिन अपॉइंटमेंट का अनुरोध करें\n- अनुस्मारक: दवा अनुस्मारक सेट करें\n- बंद: सदस्यता रद्द करें',
            'pt': 'Comandos disponíveis:\n- SINTOMA: Descreva seus sintomas\n- CONSULTA: Solicitar uma consulta de telemedicina\n- LEMBRETE: Definir lembrete de medicação\n- PARAR: Cancelar inscrição',
            'sw': 'Amri zinazopatikana:\n- DALILI: Eleza dalili zako\n- MIADI: Omba miadi ya telemedicine\n- UKUMBUSHO: Weka ukumbusho wa dawa\n- SIMAMISHA: Jitoe kwenye ujumbe'
        },
        'start': {
            'en': 'Welcome to AI HealthCare! You can now receive health alerts and support via SMS. Reply HELP for options.',
            'es': '¡Bienvenido a AI HealthCare! Ahora puede recibir alertas de salud y soporte por SMS. Responda HELP para ver las opciones.',
            'fr': 'Bienvenue à AI HealthCare ! Vous pouvez maintenant recevoir des alertes de santé et du soutien par SMS. Répondez HELP pour les options.',
            'ar': 'مرحبًا بك في AI HealthCare! يمكنك الآن تلقي تنبيهات صحية ودعم عبر الرسائل القصيرة. الرد HELP للخيارات.',
            'hi': 'AI HealthCare में आपका स्वागत है! अब आप SMS के माध्यम से स्वास्थ्य अलर्ट और सहायता प्राप्त कर सकते हैं। विकल्पों के लिए HELP जवाब दें।',
            'pt': 'Bem-vindo ao AI HealthCare! Agora você pode receber alertas de saúde e suporte via SMS. Responda HELP para opções.',
            'sw': 'Karibu kwenye AI HealthCare! Sasa unaweza kupokea arifa za afya na msaada kupitia SMS. Jibu HELP kwa chaguo.'
        },
        'stop': {
            'en': 'You have been unsubscribed from AI HealthCare messages. Reply START to re-subscribe.',
            'es': 'Se ha cancelado su suscripción a los mensajes de AI HealthCare. Responda START para volver a suscribirse.',
            'fr': 'Vous vous êtes désabonné des messages AI HealthCare. Répondez START pour vous réabonner.',
            'ar': 'لقد تم إلغاء اشتراكك في رسائل AI HealthCare. الرد START لإعادة الاشتراك.',
            'hi': 'आपने AI HealthCare संदेशों की सदस्यता रद्द कर दी है। फिर से सदस्यता लेने के लिए START जवाब दें।',
            'pt': 'Você cancelou a inscrição nas mensagens do AI HealthCare. Responda START para se inscrever novamente.',
            'sw': 'Umejiondoa kwenye ujumbe wa AI HealthCare. Jibu START ili kujiandikisha tena.'
        },
        'appointment': {
            'en': 'To schedule a telemedicine appointment, please provide a preferred date and time. A healthcare provider will contact you to confirm.',
            'es': 'Para programar una cita de telemedicina, proporcione una fecha y hora preferidas. Un proveedor de atención médica se pondrá en contacto con usted para confirmar.',
            'fr': 'Pour planifier un rendez-vous de télémédecine, veuillez indiquer une date et une heure préférées. Un prestataire de soins de santé vous contactera pour confirmer.',
            'ar': 'لتحديد موعد للطب عن بعد، يرجى تقديم التاريخ والوقت المفضلين. سيتصل بك مقدم الرعاية الصحية للتأكيد.',
            'hi': 'टेलीमेडिसिन अपॉइंटमेंट शेड्यूल करने के लिए, कृपया पसंदीदा तारीख और समय प्रदान करें। पुष्टि के लिए एक स्वास्थ्य सेवा प्रदाता आपसे संपर्क करेगा।',
            'pt': 'Para agendar uma consulta de telemedicina, forneça uma data e hora preferidas. Um profissional de saúde entrará em contato com você para confirmar.',
            'sw': 'Ili kupanga miadi ya telemedicine, tafadhali toa tarehe na wakati unaopendelea. Mtoa huduma za afya atawasiliana nawe kuthibitisha.'
        },
        'reminder': {
            'en': 'Your medication reminder has been set. You will receive SMS notifications at the scheduled times.',
            'es': 'Se ha configurado su recordatorio de medicación. Recibirá notificaciones por SMS en los horarios programados.',
            'fr': 'Votre rappel de médicament a été défini. Vous recevrez des notifications par SMS aux heures prévues.',
            'ar': 'تم تعيين تذكير الدواء الخاص بك. ستتلقى إشعارات الرسائل القصيرة في الأوقات المحددة.',
            'hi': 'आपका दवा रिमाइंडर सेट कर दिया गया है। आपको निर्धारित समय पर SMS नोटिफिकेशन प्राप्त होंगे।',
            'pt': 'Seu lembrete de medicação foi definido. Você receberá notificações por SMS nos horários programados.',
            'sw': 'Ukumbusho wako wa dawa umewekwa. Utapokea arifa za SMS kwa nyakati zilizopangwa.'
        },
        'emergency': {
            'en': 'IMPORTANT: Your symptoms suggest a medical emergency. Please seek immediate medical attention or call emergency services.',
            'es': 'IMPORTANTE: Sus síntomas sugieren una emergencia médica. Busque atención médica inmediata o llame a los servicios de emergencia.',
            'fr': 'IMPORTANT : Vos symptômes suggèrent une urgence médicale. Veuillez consulter immédiatement un médecin ou appeler les services d\'urgence.',
            'ar': 'مهم: تشير أعراضك إلى حالة طبية طارئة. يرجى طلب العناية الطبية الفورية أو الاتصال بخدمات الطوارئ.',
            'hi': 'महत्वपूर्ण: आपके लक्षण चिकित्सा आपातकाल का संकेत देते हैं। कृपया तुरंत चिकित्सा सहायता लें या आपातकालीन सेवाओं को कॉल करें।',
            'pt': 'IMPORTANTE: Seus sintomas sugerem uma emergência médica. Procure atendimento médico imediato ou ligue para os serviços de emergência.',
            'sw': 'MUHIMU: Dalili zako zinaonyesha dharura ya matibabu. Tafadhali tafuta matibabu ya haraka au piga simu kwa huduma za dharura.'
        }
    };

    // Return the response in the requested language, fallback to English if not available
    return responses[command]?.[language] || responses[command]?.['en'] || '';
}

// Define the interface for the condition to avoid using 'any'
interface SymptomCondition {
    condition: string;
    probability: number;
    description: string;
}

// Define the interface for the analysis to avoid using 'any'
interface SymptomAnalysis {
    riskLevel: string;
    urgency: string;
    recommendations: string[];
    possibleConditions: SymptomCondition[];
    followUpIn?: string;
}

/**
 * Gets appropriate AI analysis response text based on the detected language
 */
export function getAnalysisResponseText(analysis: SymptomAnalysis, language = 'en'): string {
    // Get the base response text based on language
    let responseText = '';

    // Add risk level and urgency
    switch (language) {
        case 'es':
            responseText = `Basado en su mensaje, hemos analizado sus síntomas:\n\nNivel de riesgo: ${analysis.riskLevel}\nUrgencia: ${analysis.urgency}\n\n`;
            break;
        case 'fr':
            responseText = `Selon votre message, nous avons analysé vos symptômes:\n\nNiveau de risque: ${analysis.riskLevel}\nUrgence: ${analysis.urgency}\n\n`;
            break;
        case 'ar':
            responseText = `بناءً على رسالتك، قمنا بتحليل أعراضك:\n\nمستوى الخطر: ${analysis.riskLevel}\nالإلحاح: ${analysis.urgency}\n\n`;
            break;
        case 'hi':
            responseText = `आपके संदेश के आधार पर, हमने आपके लक्षणों का विश्लेषण किया है:\n\nजोखिम स्तर: ${analysis.riskLevel}\nतत्कालिकता: ${analysis.urgency}\n\n`;
            break;
        case 'pt':
            responseText = `Com base em sua mensagem, analisamos seus sintomas:\n\nNível de risco: ${analysis.riskLevel}\nUrgência: ${analysis.urgency}\n\n`;
            break;
        case 'sw':
            responseText = `Kulingana na ujumbe wako, tumechambua dalili zako:\n\nKiwango cha hatari: ${analysis.riskLevel}\nDharura: ${analysis.urgency}\n\n`;
            break;
        default: // English
            responseText = `Based on your message, we've analyzed your symptoms:\n\nRisk level: ${analysis.riskLevel}\nUrgency: ${analysis.urgency}\n\n`;
    }

    // Add emergency warning if needed
    if (analysis.urgency === 'emergency') {
        responseText += getMultilingualResponse('emergency', language) + "\n\n";
    }

    // Add recommendations in the appropriate language
    if (analysis.recommendations && analysis.recommendations.length > 0) {
        switch (language) {
            case 'es':
                responseText += "Recomendaciones:\n- " + analysis.recommendations.slice(0, 2).join("\n- ") + "\n\n";
                break;
            case 'fr':
                responseText += "Recommandations:\n- " + analysis.recommendations.slice(0, 2).join("\n- ") + "\n\n";
                break;
            case 'ar':
                responseText += "التوصيات:\n- " + analysis.recommendations.slice(0, 2).join("\n- ") + "\n\n";
                break;
            case 'hi':
                responseText += "सिफारिशें:\n- " + analysis.recommendations.slice(0, 2).join("\n- ") + "\n\n";
                break;
            case 'pt':
                responseText += "Recomendações:\n- " + analysis.recommendations.slice(0, 2).join("\n- ") + "\n\n";
                break;
            case 'sw':
                responseText += "Mapendekezo:\n- " + analysis.recommendations.slice(0, 2).join("\n- ") + "\n\n";
                break;
            default: // English
                responseText += "Recommendations:\n- " + analysis.recommendations.slice(0, 2).join("\n- ") + "\n\n";
        }
    }

    // Add possible conditions
    if (analysis.possibleConditions && analysis.possibleConditions.length > 0) {
        switch (language) {
            case 'es':
                responseText += "Posibles condiciones para discutir con un proveedor de atención médica:\n- " +
                    analysis.possibleConditions.slice(0, 2).map(c => c.condition).join("\n- ");
                break;
            case 'fr':
                responseText += "Conditions possibles à discuter avec un prestataire de soins de santé:\n- " +
                    analysis.possibleConditions.slice(0, 2).map(c => c.condition).join("\n- ");
                break;
            case 'ar':
                responseText += "حالات محتملة لمناقشتها مع مقدم الرعاية الصحية:\n- " +
                    analysis.possibleConditions.slice(0, 2).map(c => c.condition).join("\n- ");
                break;
            case 'hi':
                responseText += "स्वास्थ्य देखभाल प्रदाता के साथ चर्चा के लिए संभावित स्थितियां:\n- " +
                    analysis.possibleConditions.slice(0, 2).map(c => c.condition).join("\n- ");
                break;
            case 'pt':
                responseText += "Possíveis condições para discutir com um profissional de saúde:\n- " +
                    analysis.possibleConditions.slice(0, 2).map(c => c.condition).join("\n- ");
                break;
            case 'sw':
                responseText += "Hali zinazowezekana kujadili na mtoa huduma za afya:\n- " +
                    analysis.possibleConditions.slice(0, 2).map(c => c.condition).join("\n- ");
                break;
            default: // English
                responseText += "Possible conditions to discuss with a healthcare provider:\n- " +
                    analysis.possibleConditions.slice(0, 2).map(c => c.condition).join("\n- ");
        }
    }

    // Add follow-up prompt
    switch (language) {
        case 'es':
            responseText += "\n\nResponda APPOINTMENT para programar una consulta con un proveedor de atención médica.";
            break;
        case 'fr':
            responseText += "\n\nRépondez APPOINTMENT pour planifier une consultation avec un prestataire de soins de santé.";
            break;
        case 'ar':
            responseText += "\n\nالرد APPOINTMENT لتحديد موعد مع مقدم الرعاية الصحية.";
            break;
        case 'hi':
            responseText += "\n\nस्वास्थ्य देखभाल प्रदाता के साथ परामर्श शेड्यूल करने के लिए APPOINTMENT उत्तर दें।";
            break;
        case 'pt':
            responseText += "\n\nResponda APPOINTMENT para agendar uma consulta com um profissional de saúde.";
            break;
        case 'sw':
            responseText += "\n\nJibu APPOINTMENT kupanga mashauriano na mtoa huduma za afya.";
            break;
        default: // English
            responseText += "\n\nReply APPOINTMENT to schedule a consultation with a healthcare provider.";
    }

    return responseText;
}
