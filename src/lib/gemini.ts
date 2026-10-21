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

export async function generateReplies(
  message: string,
  tone: string,
  isShort: boolean = false,
  imageData?: { data: string; mimeType: string }
): Promise<ReplyResponse> {
  if (!message.trim() && !imageData) {
    throw new Error("Message or screenshot is required to generate replies.");
  }

  const res = await fetch("/api/generate-replies", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, tone, isShort, imageData }),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    const rawError = errData.error || `Server responded with status ${res.status}`;
    if (typeof rawError === "string") {
      if (rawError.includes("API key not valid") || rawError.includes("API_KEY_INVALID")) {
        throw new Error("Gemini API key is invalid or expired. Please update your API key in the Settings > Secrets panel.");
      }
      if (rawError.includes("not configured")) {
        throw new Error("GEMINI_API_KEY is not configured. Please add your API key in the Settings > Secrets panel.");
      }
    }
    throw new Error(typeof rawError === "string" ? rawError : JSON.stringify(rawError));
  }

  const data = await res.json();
  if (!data.replies || !Array.isArray(data.replies) || data.replies.length === 0) {
    throw new Error("Model did not return any replies. Please try again.");
  }

  return data as ReplyResponse;
}

function getRandomFallbacks(tone: string): string[] {
  const base = FALLBACK_REPLIES[tone] || FALLBACK_REPLIES.casual;
  return [...base].sort(() => Math.random() - 0.5).slice(0, 5);
}
