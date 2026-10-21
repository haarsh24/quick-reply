import express from 'express';
import { GoogleGenAI, Type } from '@google/genai';
import path from 'path';
import { fileURLToPath } from 'url';
import { generateMoodReplies } from './src/lib/moodreply-engine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json({ limit: '10mb' }));

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

app.post('/api/generate-replies', async (req, res) => {
  const { message, tone = 'casual', isShort = false, imageData } = req.body;

  if (!message && !imageData) {
    return res.status(400).json({ error: 'Message or image required' });
  }

  const apiKey = process.env.GEMINI_API_KEY || process.env.API_KEY;

  if (apiKey) {
    try {
      const ai = new GoogleGenAI({
        apiKey,
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

      parts.push({
        text: `USER INPUT: "${message || 'refer to screenshot'}"
MOOD: "${tone}"
LENGTH: ${isShort ? '1-4 words per reply' : '1-2 natural sentences per reply'}
Generate 5 human-like replies.`,
      });

      const modelsToTry = ['gemini-2.5-flash', 'gemini-3.8-flash'];
      for (const model of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model,
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
            return res.json({
              ...parsed,
              engine: 'gemini-ai',
            });
          }
        } catch (modelErr: any) {
          console.warn(`Model ${model} attempt failed:`, modelErr?.message || modelErr);
        }
      }
    } catch (apiErr: any) {
      console.warn('Gemini API call encountered an issue:', apiErr?.message || apiErr);
    }
  }

  // High-precision context-aware engine adhering strictly to MOODREPLY rules
  const localOutput = generateMoodReplies(message || 'refer to screenshot', tone, isShort);
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
