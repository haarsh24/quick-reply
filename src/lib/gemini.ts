import { GoogleGenAI, Type } from "@google/genai";

const getApiKey = () => {
  return process.env.GEMINI_API_KEY 
      || (import.meta as any).env?.VITE_GEMINI_API_KEY 
      || (import.meta as any).env?.GEMINI_API_KEY;
};

const apiKey = getApiKey();
const ai = apiKey ? new GoogleGenAI({ apiKey }) : null;

export interface ReplyResponse {
  tone: string;
  replies: string[];
  contextAnalysis?: string;
}

export const TONES = [
  { id: "casual",    label: "Casual",    emoji: "😎", description: "Relaxed & conversational" },
  { id: "friendly",  label: "Friendly",  emoji: "😊", description: "Warm & positive" },
  { id: "corporate", label: "Corporate", emoji: "💼", description: "Polite & office-ready" },
  { id: "comfort",   label: "Comfort",   emoji: "🫂", description: "Consoling & empathetic" },
  { id: "funny",     label: "Funny",     emoji: "😂", description: "Light humor" },
  { id: "witty",     label: "Witty",     emoji: "🧠", description: "Clever & sharp" },
  { id: "flirty",    label: "Flirty",    emoji: "😏", description: "Playful & charming" },
  { id: "rizz",      label: "Rizz",      emoji: "🪄", description: "Smooth & high charisma" },
  { id: "roast",     label: "Roast",     emoji: "🔥", description: "Light teasing" },
];

export const FALLBACK_REPLIES: Record<string, string[]> = {
  casual:    ["yeah that's actually a lot to deal with", "honestly fair enough", "that tracks tbh", "low key can relate", "ngl that hit different"],
  friendly:  ["that really means a lot, thanks for sharing!", "you've totally got this!", "i'm rooting for you!", "that's such a good point honestly", "you're doing amazing"],
  corporate: ["that's worth addressing directly and thoughtfully", "a structured approach here would help clarify things", "worth taking a step back and looking at this clearly", "this deserves a considered response", "let's focus on what's actually actionable here"],
  comfort:   ["that sounds genuinely hard and you don't have to carry it alone", "whatever you're feeling right now makes complete sense", "you're allowed to not be okay", "take it one breath at a time", "i'm not going anywhere"],
  funny:     ["your timing on this is genuinely unhinged and i respect it", "the audacity, truly", "not you out here just existing like this", "okay but why is this so accurate though", "i can't even be mad that's too real"],
  witty:     ["well played, i'll give you that", "that's either genius or chaos, possibly both", "the logic is flawed but the confidence is immaculate", "bold move, let's see if it pays off", "you're operating on a different frequency entirely"],
  flirty:    ["you really just said that like it's nothing huh", "okay you definitely have my attention now", "i'm not even sure how to respond to that honestly", "you're something else aren't you", "stop you're going to make me smile too much"],
  rizz:      ["honestly you're just built different", "i'm not even surprised at this point", "you've got that energy that's hard to ignore", "effortless, genuinely", "you already know what it is"],
  roast:     ["bold of you to admit that", "you really went for it and it still didn't land", "i'd be offended but honestly respect", "that's the best you got? okay", "you tried and that's what matters i guess"],
};

const SYSTEM_PROMPT = `You are MOODREPLY — an emotionally intelligent reply generator.

PRIME RULE: Always respond to what the user actually said. Mood = tone style only, never the subject of your reply. A reply that matches the mood but ignores the input is a failure.

MOOD STYLES:
- casual: lowercase, chill, like texting a close friend
- friendly: warm, genuine, upbeat
- corporate: composed, professional, solution-focused — NOT auto-reply filler like "acknowledged" or "let's circle back"
- comfort: gentle, validating, emotionally present — NOT bot phrases like "I'm here for you" as an opener
- funny: clever setup + punchy punchline, self-aware humor
- witty: sharp, well-timed, smart
- flirty: playful, confident, charming
- rizz: effortlessly smooth, high charisma
- roast: light teasing, punchy, never actually mean

OUTPUT RULES:
- 1-2 sentences per reply max
- Reference something specific from the input — never write something that could apply to any message
- casual / comfort / funny / flirty / rizz → lowercase, minimal punctuation
- corporate → professional but human
- If input carries real emotion (anxiety, grief, stress) → lead with empathy first, then apply mood style
- Never use: "acknowledged", "standing by", "let's circle back", or any chatbot auto-reply phrase`;

export async function generateReplies(
  message: string,
  tone: string,
  isShort: boolean = false,
  imageData?: { data: string; mimeType: string }
): Promise<ReplyResponse> {
  if (!message.trim() && !imageData) {
    throw new Error("Message or image required");
  }

  if (!ai) {
    console.warn("AI not initialized - using fallbacks");
    return { tone, replies: getRandomFallbacks(tone) };
  }

  try {
    const parts: any[] = [];
    if (imageData) {
      parts.push({
        inlineData: {
          data: imageData.data.includes(",") ? imageData.data.split(",")[1] : imageData.data,
          mimeType: imageData.mimeType
        }
      });
    }

    parts.push({
      text: `USER INPUT: "${message || "refer to image"}"
MOOD: "${tone}"
LENGTH: ${isShort ? "1-4 words per reply" : "1-2 natural sentences per reply"}
Generate 5 human-like replies.`
    });

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: [{ role: "user", parts }],
      config: {
        systemInstruction: SYSTEM_PROMPT,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            tone: { type: Type.STRING },
            contextAnalysis: { type: Type.STRING },
            replies: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          },
          required: ["tone", "replies", "contextAnalysis"]
        },
        temperature: 0.9,
      },
    });

    const text = response.text;
    if (!text) throw new Error("Empty response from AI");
    
    try {
      const parsed = JSON.parse(text);
      if (!parsed.replies || parsed.replies.length === 0) {
        throw new Error("No replies in parsed JSON");
      }
      return parsed as ReplyResponse;
    } catch (parseError) {
      console.error("JSON Parse Error:", parseError, "Raw Text:", text);
      throw new Error("Invalid JSON structure from model");
    }

  } catch (error: any) {
    console.error("AI Error:", error?.message || error);
    return {
      tone,
      replies: getRandomFallbacks(tone),
      contextAnalysis: "Fallback mode active due to AI error.",
    };
  }
}

function getRandomFallbacks(tone: string): string[] {
  const base = FALLBACK_REPLIES[tone] || FALLBACK_REPLIES.casual;
  return [...base].sort(() => Math.random() - 0.5).slice(0, 5);
}
