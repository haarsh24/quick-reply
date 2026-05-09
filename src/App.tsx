import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Copy, 
  Check, 
  Zap, 
  RefreshCw,
  Sparkles,
  Heart,
  Image as ImageIcon,
  Upload,
  X,
  MessageSquare,
  Wand2
} from "lucide-react";
import { TONES, generateReplies, type ReplyResponse } from "./lib/gemini.ts";

const LOADING_MESSAGES = [
  "DETECTING INTENT...",
  "UNDERSTANDING CONTEXT...",
  "GENERATING DRAFTS...",
  "STYLING MOOD...",
  "CHECKING RELEVANCE...",
  "REFINING REPLIES..."
];

export default function App() {
  const [message, setMessage] = useState("");
  const [image, setImage] = useState<string | null>(null);
  const [imageMimeType, setImageMimeType] = useState<string | null>(null);
  const [selectedTone, setSelectedTone] = useState(TONES.find(t => t.id === "rizz")?.id || TONES[0].id);
  const [isShort, setIsShort] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
  const [result, setResult] = useState<ReplyResponse | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        setError("Image must be under 4MB, bro.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(",")[1];
        setImage(base64String);
        setImageMimeType(file.type);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setImage(null);
    setImageMimeType(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleGenerate = async () => {
    if (!message.trim() && !image) {
      setError("I need a message or a screenshot to work with!");
      return;
    }
    
    setLoading(true);
    setLoadingMessage(LOADING_MESSAGES[0]);
    setError(null);
    
    // Cycle through messages to show progress
    const messageInterval = setInterval(() => {
      setLoadingMessage(prev => {
        const currentIndex = LOADING_MESSAGES.indexOf(prev);
        return LOADING_MESSAGES[(currentIndex + 1) % LOADING_MESSAGES.length];
      });
    }, 600);

    try {
      const imageData = image && imageMimeType ? { data: image, mimeType: imageMimeType } : undefined;
      // Ensure it takes at least 2.5 seconds for "quality feel"
      const [data] = await Promise.all([
        generateReplies(message, selectedTone, isShort, imageData),
        new Promise(resolve => setTimeout(resolve, 2500))
      ]);
      setResult(data);
    } catch (err: any) {
      setError("Even Reply Bro hit a wall. Maybe your rizz is too high for the server? Try again.");
    } finally {
      clearInterval(messageInterval);
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="min-h-screen bg-bg-deep text-slate-100 font-sans selection:bg-brand-primary/30 pb-20 overflow-x-hidden">
      {/* Background Ambience */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[80%] h-[60%] bg-brand-primary/5 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[50%] bg-brand-accent/5 blur-[150px] rounded-full" />
      </div>

      <main className="max-w-2xl mx-auto px-5 pt-8 md:pt-16 flex flex-col gap-12">
        {/* Header - Simple & Impactful */}
        <header className="flex flex-col items-start gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-black fill-black" />
            </div>
            <div className="flex flex-col">
              <h1 className="text-2xl font-display font-black tracking-tighter uppercase">Reply Bro</h1>
              <p className="text-[10px] font-black tracking-[0.3em] uppercase text-white/30">Social Intelligence v2.1</p>
            </div>
          </div>
        </header>

        {/* Action Center */}
        <section className="flex flex-col gap-8">
          <div className="cred-card p-1">
            <div className="p-5 md:p-8 flex flex-col gap-8">
              <div className="flex flex-col gap-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">1. Define Context</h2>
                  <button 
                    onClick={() => setIsShort(!isShort)}
                    className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-500 border ${
                      isShort ? 'bg-white text-black border-white' : 'border-white/10 text-white/30'
                    }`}
                  >
                    Short Mode {isShort ? 'ON' : 'OFF'}
                  </button>
                </div>
                
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Paste the message context here..."
                  className="w-full min-h-[160px] p-0 text-xl md:text-2xl font-medium bg-transparent border-none focus:ring-0 resize-none outline-none placeholder:text-white/10"
                />

                {/* Integrated Upload Area */}
                <div className="relative">
                  <input type="file" ref={fileInputRef} onChange={handleImageUpload} accept="image/*" className="hidden" />
                  {!image ? (
                    <button 
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-2 text-white/30 hover:text-white transition-colors duration-300"
                    >
                      <Upload className="w-4 h-4" />
                      <span className="text-[10px] font-black uppercase tracking-widest">Attach Screenshot</span>
                    </button>
                  ) : (
                    <div className="relative group rounded-xl overflow-hidden border border-white/10 inline-block">
                      <img src={`data:${imageMimeType};base64,${image}`} className="h-20 w-auto opacity-50 group-hover:opacity-100 transition-opacity" alt="Preview" />
                      <button onClick={clearImage} className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                        <X className="w-4 h-4 text-white" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div className="h-px bg-white/5" />

              <div className="flex flex-col gap-4">
                <h2 className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">2. Select Persona</h2>
                <div className="flex flex-wrap gap-2">
                  {TONES.map((tone) => (
                    <button
                      key={tone.id}
                      onClick={() => setSelectedTone(tone.id)}
                      className={`tone-pill ${selectedTone === tone.id ? "tone-pill-active" : "tone-pill-inactive"}`}
                    >
                      <span>{tone.emoji}</span>
                      <span>{tone.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                onClick={handleGenerate}
                disabled={loading || (!message.trim() && !image)}
                className="w-full h-16 bg-white text-black rounded-2xl font-black text-sm uppercase tracking-[0.2em] hover:scale-[1.02] active:scale-[0.98] disabled:opacity-10 disabled:grayscale transition-all duration-500 shadow-[0_0_40px_rgba(255,255,255,0.1)] flex items-center justify-center gap-3"
              >
                {loading ? (
                  <div className="flex items-center gap-3">
                    <RefreshCw className="w-5 h-5 animate-spin" />
                    <span className="shimmer opacity-80">{loadingMessage}</span>
                  </div>
                ) : (
                  "Cook Best Replies"
                )}
              </button>
            </div>
          </div>

          {error && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 rounded-xl border border-red-500/20 bg-red-500/5 text-red-500 text-[10px] font-black uppercase tracking-widest text-center">
              {error}
            </motion.div>
          )}
        </section>

        {/* Results Stream */}
        <AnimatePresence mode="wait">
          {result && (
            <motion.section 
              key="results"
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              className="flex flex-col gap-6"
            >
              {result.contextAnalysis && (
                <div className="cred-card p-6 border-white/10 bg-gradient-to-br from-brand-primary/10 to-transparent">
                  <div className="flex items-start gap-4">
                    <Sparkles className="w-5 h-5 text-brand-primary shrink-0 mt-1" />
                    <div className="flex flex-col gap-1">
                      <span className="text-[9px] font-black uppercase tracking-[0.2em] text-brand-primary">The Reading</span>
                      <p className="text-sm font-medium leading-relaxed text-white/80">{result.contextAnalysis}</p>
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-3">
                {result.replies.map((reply, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    onClick={() => copyToClipboard(reply, idx)}
                    className="reply-card hover:cred-card-active"
                  >
                    <p className="text-base font-semibold leading-relaxed pr-8">{reply}</p>
                    <div className="shrink-0 scale-90">
                      {copiedIndex === idx ? (
                        <Check className="w-5 h-5 text-emerald-400 stroke-[3px]" />
                      ) : (
                        <Copy className="w-5 h-5 text-white/20 group-hover:text-white/100 transition-colors" />
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>

              <button 
                onClick={() => { setResult(null); setMessage(""); clearImage(); }}
                className="mx-auto flex items-center gap-2 text-white/20 hover:text-white transition-colors text-[9px] font-black uppercase tracking-[0.3em] py-8"
              >
                <RefreshCw className="w-3 h-3" />
                Clear Protocol
              </button>
            </motion.section>
          )}
        </AnimatePresence>
      </main>

      <footer className="mt-auto py-12 flex flex-col items-center gap-8 px-6 text-center">
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-4 items-center">
            <div className="h-px w-8 bg-white/5" />
            <Heart className="w-4 h-4 text-brand-primary fill-brand-primary animate-pulse" />
            <div className="h-px w-8 bg-white/5" />
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 text-white/30 text-xs">
          <div className="flex items-center gap-1.5 hover:text-white transition-colors cursor-default">
            <span>Made with precision by</span>
            <a 
              href="https://github.com/haarsh24" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-bold text-white hover:text-brand-primary transition-colors underline decoration-brand-primary/30 underline-offset-4"
            >
              Harsh
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
