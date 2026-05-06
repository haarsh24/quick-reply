import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export interface ReplyResponse {
  tone: string;
  replies: string[];
}

export const TONES = [
  { id: "casual", label: "Casual", emoji: "😎", description: "Relaxed & conversational" },
  { id: "friendly", label: "Friendly", emoji: "😊", description: "Warm & positive" },
  { id: "corporate", label: "Corporate", emoji: "💼", description: "Polite & office-ready" },
  { id: "comfort", label: "Comfort", emoji: "🫂", description: "Consoling & empathetic" },
  { id: "funny", label: "Funny", emoji: "😂", description: "Light humor" },
  { id: "witty", label: "Witty", emoji: "🧠", description: "Clever & sharp" },
  { id: "flirty", label: "Flirty", emoji: "😏", description: "Playful & charming" },
  { id: "roast", label: "Roast", emoji: "🔥", description: "Light teasing" },
];

export async function generateReplies(message: string, tone: string, isShort: boolean = false): Promise<ReplyResponse> {
  if (!message.trim()) {
    throw new Error("Message cannot be empty");
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Message: "${message}"\nTone: "${tone}"\nLength Constraint: ${isShort ? "Keep it extremely short (1-5 words)" : "Normal texting length"}`,
      config: {
        systemInstruction: `You are an AI Reply Generator that creates natural, human-like responses to messages.
        
GOAL:
Generate exactly 5 realistic replies that sound like a real person texting.

RULES:
- ${isShort ? "ULTRA CONCISE: Each reply must be between 1 to 5 words maximum." : "CONCISE: Each reply must be 1-2 lines maximum."}
- Avoid repetition.
- No formal greetings like "Dear" or "Hello [Name]". 
- Use natural texting style (lowercase is fine, limited punctuation).
- Emojis: Use only for casual, friendly, funny, flirty, comfort (max 1-2 per reply).

TONE GUIDELINES:
- casual: relaxed, low-effort
- corporate: polite, clear, workplace-appropriate
- comfort: empathetic, supportive, consoling
- funny: relatable, slight humor
- flirty: playful, subtle
- roast: cheeky teasing
- witty: clever, brief
- friendly: warm, approachable`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["tone", "replies"],
          properties: {
            tone: { type: Type.STRING },
            replies: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              minItems: 5,
              maxItems: 5,
            },
          },
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text) as ReplyResponse;
  } catch (error) {
    console.error("Gemini Error:", error);
    throw error;
  }
}
