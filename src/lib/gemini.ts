import { generateMoodReplies } from "./moodreply-engine";

export interface ReplyResponse {
  tone: string;
  replies: string[];
  contextAnalysis?: string;
  detectedText?: string;
  note?: string;
  engine?: 'gemini-ai' | 'contextual-nlp' | 'ocr-nlp';
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

export async function generateReplies(
  message: string,
  tone: string,
  isShort: boolean = false,
  imageData?: { data: string; mimeType: string }
): Promise<ReplyResponse> {
  if (!message.trim() && !imageData) {
    throw new Error("Message or screenshot is required to generate replies.");
  }

  try {
    const res = await fetch("/api/generate-replies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message, tone, isShort, imageData }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.replies && Array.isArray(data.replies) && data.replies.length > 0) {
        return data as ReplyResponse;
      }
    }
  } catch {
    // Seamless fallback to the built-in MOODREPLY engine
  }

  // Pure zero-failure contextual fallback conforming strictly to all MOODREPLY rules
  const fallbackInput = message.trim() || (imageData ? 'conversation screenshot' : 'hey');
  return generateMoodReplies(fallbackInput, tone, isShort);
}
