/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Copy, 
  Check, 
  Zap, 
  RefreshCw,
  Sparkles,
  Heart
} from "lucide-react";
import { TONES, generateReplies, type ReplyResponse } from "./lib/gemini.ts";

const LOADING_MESSAGES = [
  "Consulting the text gods...",
  "Avoiding awkward silence...",
  "Channeling your inner rizz...",
  "Scanning for red flags...",
  "Polishing the sarcasm...",
  "Decoding the vibe...",
  "Thinking of something cool..."
];

export default function App() {
  const [message, setMessage] = useState("");
  const [selectedTone, setSelectedTone] = useState(TONES[0].id);
  const [isShort, setIsShort] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
  const [result, setResult] = useState<ReplyResponse | null>(null);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    if (!message.trim()) return;
    
    setLoading(true);
    setLoadingMessage(LOADING_MESSAGES[Math.floor(Math.random() * LOADING_MESSAGES.length)]);
    setError(null);
    try {
      const data = await generateReplies(message, selectedTone, isShort);
      setResult(data);
    } catch (err: any) {
      // We have fallbacks in the service, but if even that fails:
      setError("Even our emergency backup brain failed 💀 Try again?");
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="min-h-screen font-sans selection:bg-brand-secondary/20 scroll-smooth">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-indigo-100 rounded-full blur-[120px] opacity-50" />
        <div className="absolute top-[20%] -right-[10%] w-[30%] h-[30%] bg-blue-50 rounded-full blur-[100px] opacity-40" />
      </div>

      <main className="max-w-2xl mx-auto px-4 py-8 md:px-6 md:py-20 flex flex-col gap-10">
        {/* Header */}
        <header className="flex flex-col items-center text-center gap-4">
          <motion.div 
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-10 h-10 md:w-12 md:h-12 bg-indigo-600 rounded-xl md:rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200"
          >
            <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-white" />
          </motion.div>
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl font-display font-bold tracking-tight text-zinc-900 md:text-5xl">
              QuickReply
            </h1>
            <p className="text-sm md:text-base text-zinc-500 font-medium">
              Turn awkward pauses into perfect replies.
            </p>
          </div>
        </header>

        {/* Input Section */}
        <section className="flex flex-col gap-8">
          <div className="flex flex-col gap-6 p-5 md:p-8 rounded-[2rem] md:rounded-[2.5rem] bg-white border border-zinc-200 shadow-sm relative overflow-hidden">
            {/* Length Toggle */}
            <div className="absolute top-5 right-5 flex items-center gap-2">
              <span className={`text-[9px] md:text-[10px] font-bold uppercase tracking-widest transition-colors ${isShort ? 'text-indigo-600' : 'text-zinc-400'}`}>
                {isShort ? "Short mode" : "Standard"}
              </span>
              <button 
                onClick={() => setIsShort(!isShort)}
                className={`w-8 md:w-10 h-4 md:h-5 rounded-full transition-colors relative flex items-center ${isShort ? 'bg-indigo-600' : 'bg-zinc-200'}`}
              >
                <motion.div 
                  animate={{ x: isShort ? (window.innerWidth < 768 ? 16 : 22) : 2 }}
                  className="w-3 h-3 md:w-4 md:h-4 bg-white rounded-full shadow-sm"
                />
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <label htmlFor="message" className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-zinc-400 px-1 flex justify-between items-center">
                <span>Input Message</span>
                {message && (
                  <button onClick={() => setMessage("")} className="text-zinc-300 hover:text-zinc-500 transition-colors">
                    <RefreshCw className="w-3 h-3" />
                  </button>
                )}
              </label>
              
              <div className="relative group">
                <textarea
                  id="message"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Paste the message you received here..."
                  className="w-full min-h-[120px] md:min-h-[140px] p-4 md:p-5 text-base md:text-lg bg-zinc-50 border-2 border-transparent rounded-2xl md:rounded-[2rem] focus:bg-white focus:border-indigo-500/10 transition-all resize-none outline-none placeholder:text-zinc-400"
                />
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <label className="text-[10px] md:text-xs font-bold uppercase tracking-widest text-zinc-400 px-1">
                Select Tone
              </label>
              <div className="flex flex-wrap gap-1.5 md:gap-2">
                {TONES.map((tone) => (
                  <button
                    key={tone.id}
                    onClick={() => setSelectedTone(tone.id)}
                    className={`tone-pill group relative py-1.5 px-3 md:py-2 md:px-4 ${
                      selectedTone === tone.id 
                        ? "tone-pill-active" 
                        : "tone-pill-inactive"
                    }`}
                  >
                    <span className="mr-1 md:mr-1.5">{tone.emoji}</span>
                    <span className="text-xs md:text-sm">{tone.label}</span>
                    
                    {/* Tooltip on hover - desktop only */}
                    <div className="hidden md:block absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-zinc-800 text-white text-[10px] rounded opacity-0 group-hover:opacity-100 whitespace-nowrap pointer-events-none transition-opacity z-10">
                      {tone.description}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={handleGenerate}
              disabled={loading || !message.trim()}
              className="w-full h-14 md:h-16 bg-zinc-900 text-white rounded-2xl md:rounded-[1.5rem] font-bold text-base md:text-lg flex items-center justify-center gap-2 hover:bg-zinc-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-zinc-200 active:scale-[0.98]"
            >
              {loading ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  {loadingMessage}
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 fill-indigo-400 text-indigo-400" />
                  Generate 5 Replies
                </>
              )}
            </button>

            {error && (
              <p className="text-red-500 text-xs font-medium text-center bg-red-50 p-3 rounded-xl border border-red-100">
                {error}
              </p>
            )}
          </div>
        </section>

        {/* Results Section */}
        <AnimatePresence mode="wait">
          {result && (
            <motion.section
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col gap-5 md:gap-6"
            >
              <div className="flex items-center justify-between px-2">
                <div className="flex flex-col">
                  <h2 className="text-[10px] md:text-sm font-bold uppercase tracking-widest text-zinc-400">
                    Perfected Replies
                  </h2>
                  <p className="text-[8px] md:text-[10px] text-zinc-300 font-bold uppercase">
                    {isShort ? "Ultra-Concise Mode" : "Standard Length"}
                  </p>
                </div>
                <div className="flex items-center gap-2 text-indigo-600 text-[10px] md:text-xs font-bold bg-white border border-indigo-100 px-3 md:px-4 py-1.5 rounded-full shadow-sm">
                  <Zap className="w-2.5 h-2.5 md:w-3 md:h-3 fill-indigo-600" />
                  {TONES.find(t => t.id === selectedTone)?.label}
                </div>
              </div>

              <div className="flex flex-col gap-2.5 md:gap-3">
                {result.replies.map((reply, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="group relative"
                  >
                    <div 
                      onClick={() => copyToClipboard(reply, idx)}
                      className="reply-card flex items-center justify-between gap-4 p-4 md:p-5"
                    >
                      <p className="text-sm md:text-base text-zinc-800 leading-relaxed pr-6 md:pr-8 font-medium">
                        {reply}
                      </p>
                      <div className="flex-shrink-0">
                        {copiedIndex === idx ? (
                          <motion.div 
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="flex items-center gap-1.5 text-emerald-600"
                          >
                            <Check className="w-3.5 h-3.5 md:w-4 md:h-4 stroke-[3px]" />
                            <span className="text-[10px] md:text-xs font-bold uppercase tracking-tighter">Copied</span>
                          </motion.div>
                        ) : (
                          <div className="p-2 md:p-2.5 bg-zinc-50 rounded-lg md:rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300">
                            <Copy className="w-3.5 h-3.5 md:w-4 md:h-4" />
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              <button 
                onClick={() => {
                  setResult(null);
                  setMessage("");
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="mx-auto flex items-center gap-2 text-zinc-400 hover:text-zinc-900 transition-colors text-[10px] md:text-xs font-bold uppercase tracking-widest pt-2"
              >
                <RefreshCw className="w-3 h-3" />
                Reset & New Input
              </button>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Empty State / Tips */}
        {!result && !loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center gap-6 text-center py-4"
          >
            <div className="grid grid-cols-2 gap-4 w-48 md:w-64 opacity-20 grayscale">
              <div className="h-1.5 rounded-full bg-zinc-400" />
              <div className="h-1.5 rounded-full bg-zinc-400 w-2/3" />
              <div className="h-1.5 rounded-full bg-zinc-400 w-1/2" />
              <div className="h-1.5 rounded-full bg-zinc-400 w-3/4" />
            </div>
            <p className="text-[10px] md:text-xs font-medium text-zinc-400 max-w-[200px] md:max-w-[240px] leading-relaxed">
              Select your vibe above and hit generate to see the magic.
            </p>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="mt-20 py-10 border-t border-zinc-200 md:border-zinc-900 w-full flex justify-center items-center text-zinc-500 text-sm">
        <div className="flex items-center gap-1.5 hover:text-zinc-700 md:hover:text-zinc-300 transition-colors cursor-default">
          <span>Made with</span>
          <Heart className="w-4 h-4 text-brand-primary fill-brand-primary animate-pulse" />
          <span>by</span>
          <a 
            href="https://github.com/haarsh24" 
            target="_blank" 
            rel="noopener noreferrer"
            className="font-bold text-zinc-900 md:text-zinc-300 hover:text-brand-primary transition-colors hover:underline decoration-brand-primary/30 underline-offset-4"
          >
            Harsh
          </a>
        </div>
      </footer>
    </div>
  );
}
