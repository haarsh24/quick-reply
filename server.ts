import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateMoodReplies } from './src/lib/moodreply-engine.js';
import { createWorker } from 'tesseract.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

// Singleton OCR worker promise for fast screenshot analysis
let ocrWorkerPromise: Promise<any> | null = null;
function getOcrWorker() {
  if (!ocrWorkerPromise) {
    ocrWorkerPromise = createWorker('eng').catch((err) => {
      ocrWorkerPromise = null;
      throw err;
    });
  }
  return ocrWorkerPromise;
}

async function extractTextFromScreenshot(base64Data: string): Promise<string> {
  try {
    const raw = base64Data.includes(',') ? base64Data.split(',')[1] : base64Data;
    const buf = Buffer.from(raw, 'base64');
    if (buf.length < 50) return '';

    const worker = await getOcrWorker();
    const ocrPromise = worker.recognize(buf).then((res: any) => {
      const txt = (res?.data?.text || '').trim();
      // Clean up OCR line breaks and excessive whitespace
      return txt.replace(/\s+/g, ' ');
    });

    const timeoutPromise = new Promise<string>((_, reject) =>
      setTimeout(() => reject(new Error('OCR timeout')), 4000)
    );

    return await Promise.race([ocrPromise, timeoutPromise]);
  } catch {
    return '';
  }
}

const SYSTEM_PROMPT = `You are MOODREPLY — an emotionally intelligent reply generator.

PRIME RULE: Always respond to what the user actually said. Mood = tone style only, never the subject of your reply. A reply that matches the mood but ignores the input is a failure.

MOOD STYLES:
- casual: actual texting energy, not performed casualness. lowercase, zero effort.
- friendly: warm and genuine, not over the top. cheerful without the exclamation marks.
- corporate: sharp colleague in a 1:1, not a support bot. plain words, short sentences. no "I appreciate you being direct" / "let's pivot" / "I'm committed to".
- comfort: close friend who listens, not a therapist on script. soft and specific. no "I'm here for you" openers.
- funny: perfectly timed comeback. clever setup, punchy close. never explain the joke.
- witty: dry and effortless. one sharp observation beats three clever lines.
- flirty: confident and playful, not thirsty. light touch.
- rizz: smooth and accidental-looking. short, zero desperation.
- roast: specific to what they said, never generic. funny enough they laugh at themselves.

OUTPUT RULES:
- 1-2 sentences per reply max
- Reference something specific from the input — never write something that could apply to any message
- casual / comfort / funny / flirty / rizz → lowercase, minimal punctuation
- corporate → professional but human
- If input carries real emotion (anxiety, grief, stress) → lead with empathy first, then apply mood style
- Never use: "acknowledged", "standing by", "let's circle back", or any chatbot auto-reply phrase`;

// Track API key operational status to avoid repetitive failures and log clutter
let activeApiKey: string | null = null;
let isKeyOperational = false;
let lastKeyValidationTime = 0;

app.post('/api/generate-replies', async (req, res) => {
  const { message = '', tone = 'casual', isShort = false, imageData } = req.body;

  if (!message.trim() && !imageData) {
    return res.status(400).json({ error: 'Message or image required' });
  }

  // Extract readable text from screenshot if provided
  let detectedText = '';
  if (imageData && imageData.data) {
    detectedText = await extractTextFromScreenshot(imageData.data);
  }

  const rawKey = (process.env.GEMINI_API_KEY || process.env.API_KEY || '').trim();

  // Reset check if API key changes
  if (rawKey !== activeApiKey) {
    activeApiKey = rawKey;
    isKeyOperational = false;
    lastKeyValidationTime = 0;
  }

  // Attempt Gemini if key exists and isn't known to be invalid in the last 10 minutes
  const shouldTryGemini = Boolean(
    rawKey &&
    rawKey.length > 20 &&
    (isKeyOperational || Date.now() - lastKeyValidationTime > 600000)
  );

  if (shouldTryGemini) {
    try {
      const ai = new GoogleGenAI({
        apiKey: rawKey,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });

      const parts: any[] = [];
      if (imageData && imageData.data) {
        parts.push({
          inlineData: {
            data: imageData.data.includes(',') ? imageData.data.split(',')[1] : imageData.data,
            mimeType: imageData.mimeType || 'image/png',
          },
        });
      }

      const promptContext = message.trim()
        ? (detectedText ? `USER NOTE: "${message.trim()}"\nDETECTED TEXT IN SCREENSHOT: "${detectedText}"` : `USER INPUT: "${message.trim()}"`)
        : (detectedText ? `SCREENSHOT CONVERSATION: "${detectedText}"` : 'Analyze the attached conversation screenshot and reply to the other person.');

      parts.push({
        text: `${promptContext}\nMOOD: "${tone}"\nLENGTH: ${isShort ? '1-4 words per reply' : '1-2 natural sentences per reply'}\nGenerate 5 human-like replies reacting directly to the other person in the screenshot.`,
      });

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [{ role: 'user', parts }],
        config: {
          systemInstruction: SYSTEM_PROMPT,
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              tone: { type: Type.STRING },
              contextAnalysis: { type: Type.STRING },
              replies: {
                type: Type.ARRAY,
                items: { type: Type.STRING },
              },
            },
            required: ['tone', 'replies', 'contextAnalysis'],
          },
          temperature: 0.85,
        },
      });

      if (response.text) {
        const parsed = JSON.parse(response.text);
        isKeyOperational = true;
        return res.json({
          ...parsed,
          detectedText: detectedText || undefined,
          engine: 'gemini-ai',
        });
      }
    } catch {
      // API key is invalid, expired, or rate-limited.
      isKeyOperational = false;
      lastKeyValidationTime = Date.now();
    }
  }

  // High-precision context-aware engine adhering strictly to MOODREPLY rules
  const effectiveMessage = message.trim()
    ? message.trim()
    : (detectedText && detectedText.length > 2)
      ? detectedText
      : (imageData ? 'conversation screenshot' : 'hey');

  const localOutput = generateMoodReplies(effectiveMessage, tone, isShort, detectedText || undefined);
  return res.json({
    ...localOutput,
  });
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
