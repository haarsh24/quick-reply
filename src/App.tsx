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

  const handleClearText = () => {
    setMessage("");
    setResult(null);
    setError(null);
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setMessage(val);
    if (!val.trim() && !image) {
      setResult(null);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 4 * 1024 * 1024) {
        setError("Image must be under 4MB, bro.");
        return;
      }
      // Instantly wipe old answers when attaching a new image
      setResult(null);
      setError(null);
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
    setResult(null);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleGenerate = async () => {
    if (!message.trim() && !image) {
      setError("I need a message or a screenshot to work with!");
      return;
    }
    
    // Wipe previous result immediately so old answers are never displayed during/after generation
    setResult(null);
    setLoading(true);
    const initialLoadingMsg = image && !message.trim() ? "ANALYZING SCREENSHOT..." : LOADING_MESSAGES[0];
    setLoadingMessage(initialLoadingMsg);
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
      const [data] = await Promise.all([
        generateReplies(message, selectedTone, isShort, imageData),
        new Promise(resolve => setTimeout(resolve, 600))
      ]);
      setResult(data);
    } catch (err: any) {
      setError(err?.message || "Failed to generate replies. Please try again.");
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
                  <div className="flex items-center gap-2">
                    {message.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearText}
                        className="px-2.5 py-1 rounded-full text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                        title="Clear message text"
                      >
                        Clear Text
                      </button>
                    )}
                    <button 
                      onClick={() => setIsShort(!isShort)}
                      className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest transition-all duration-500 border ${
                        isShort ? 'bg-white text-black border-white' : 'border-white/10 text-white/30'
                      }`}
                    >
                      Short Mode {isShort ? 'ON' : 'OFF'}
                    </button>
                  </div>
                </div>
                
                <textarea
                  value={message}
                  onChange={handleTextChange}
                  placeholder="Paste the message context or attach a screenshot below..."
                  className="w-full min-h-[140px] p-0 text-xl md:text-2xl font-medium bg-transparent border-none focus:ring-0 resize-none outline-none placeholder:text-white/10"
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
                    <div className="flex items-center gap-3 p-2.5 rounded-xl border border-white/15 bg-white/5 inline-flex">
                      <div className="relative rounded-lg overflow-hidden border border-white/10 shrink-0">
                        <img src={`data:${imageMimeType};base64,${image}`} className="h-14 w-auto object-cover max-w-[120px]" alt="Preview" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-[10px] font-black uppercase tracking-wider text-emerald-400">Screenshot Attached</span>
                        <span className="text-[10px] text-white/40">Ready to analyze conversation</span>
                      </div>
                      <button 
                        onClick={clearImage} 
                        className="p-1.5 rounded-lg hover:bg-white/10 text-white/50 hover:text-white transition-colors ml-2"
                        title="Remove screenshot"
                      >
                        <X className="w-4 h-4" />
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
              {result.detectedText && (
                <div className="cred-card p-4 border-emerald-500/20 bg-emerald-500/5 flex items-center gap-3">
                  <ImageIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                  <div className="flex flex-col min-w-0">
                    <span className="text-[9px] font-black uppercase tracking-widest text-emerald-400">Detected in Screenshot</span>
                    <p className="text-xs text-white/80 truncate font-mono mt-0.5">"{result.detectedText}"</p>
                  </div>
                </div>
              )}

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
              href="https://www.kumarharsh.in" 
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
