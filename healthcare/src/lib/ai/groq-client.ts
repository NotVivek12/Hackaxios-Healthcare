import Groq from 'groq-sdk';

let groq: Groq | null = null;

function getGroqClient(): Groq | null {
  if (groq) return groq;
  const key = process.env.GROQ_API_KEY?.trim();
  if (!key) {
    console.warn('GROQ_API_KEY is not set; AI features will use fallbacks.');
    return null;
  }
  try {
    groq = new Groq({ apiKey: key });
    return groq;
  } catch (err) {
    console.error('Failed to init Groq client:', err);
    return null;
  }
}

export { getGroqClient };
