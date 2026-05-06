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

export const FALLBACK_REPLIES: Record<string, string[]> = {
  casual: ["my bad, my brain just rebooted 💀", "sorry, lost the plot for a sec", "let me get back to you on that", "mood lol", "valid"],
  corporate: ["I'll loop back to you on this later.", "Let's touch base when my server is stable.", "Acknowledged. Standing by.", "I'm processing this offline.", "Let's circle back."],
  comfort: ["I'm here for you, just having some tech issues 🫂", "Sending a virtual hug while I fix my brain.", "Thinking of you, even when I'm lagging.", "Sorry, I'm a bit overwhelmed right now.", "I've got your back, give me a sec."],
  funny: ["error 404: social skills not found", "my last two brain cells are fighting", "even the AI is ghosting you now", "loading my personality... 1%", "brb, charging my humor"],
  witty: ["my brilliance is currently on a coffee break", "i'd reply, but i'm busy being a robot", "too clever for my own good (and this connection)", "processing... or just staring blankly", "sarcasm module overheated"],
  flirty: ["my heart skipped a beat and crashed my server", "too shy to reply right now 😉", "lost in your eyes, be right back", "charging my charm...", "checking my schedule for you"],
  roast: ["my insults are too powerful for this wifi", "i'd roast you but the server is protecting you", "lagging just like your jokes", "trying to find a reply as mid as that message", "my logic is failing, just like your rizz"],
};

export async function generateReplies(message: string, tone: string, isShort: boolean = false): Promise<ReplyResponse> {
  if (!message.trim()) {
    throw new Error("Message cannot be empty");
  }

  // Create a promise that rejects after 10 seconds
  const timeout = new Promise<never>((_, reject) => {
    setTimeout(() => reject(new Error("AI took too long to think 💤")), 12000);
  });

  try {
    const aiCall = ai.models.generateContent({
      model: "gemini-1.5-flash", // Use 1.5 flash for better reliability
      contents: `Message: "${message}"\nTone: "${tone}"\nLength: ${isShort ? "ultra short" : "normal"}`,
      config: {
        systemInstruction: `You are QuickReply AI. Generate 5 realistic, human-sounding replies.
        - ${isShort ? "VERY SHORT (1-5 words)" : "NORMAL TEXTING LENGTH"}
        - NO robot talk. NO greetings like "Hello".
        - Natural imperfections are good.
        - Tone: ${tone}.`,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          required: ["tone", "replies"],
          properties: {
            tone: { type: Type.STRING },
            replies: { type: Type.ARRAY, items: { type: Type.STRING }, minItems: 5, maxItems: 5 },
          },
        },
      },
    });

    // Race the AI call against the timeout
    const result = await Promise.race([aiCall, timeout]);
    const response = await (result as any).response;
    const text = response.text();
    
    if (!text) throw new Error("Empty response");
    return JSON.parse(text) as ReplyResponse;
  } catch (error) {
    console.error("AI failed, using funny fallbacks:", error);
    // Return funny fallbacks based on tone
    return {
      tone: tone,
      replies: FALLBACK_REPLIES[tone] || FALLBACK_REPLIES.casual
    };
  }
}
