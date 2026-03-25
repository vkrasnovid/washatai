"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ResultCard from "@/components/ResultCard";

const LOADING_MESSAGES = [
  "Consulting the vibe oracle...",
  "Scanning for human fingerprints...",
  "Checking for soul traces...",
  "Measuring emotional authenticity...",
  "Counting the semicolons...",
  "Analyzing existential dread levels...",
  "Looking for signs of consciousness...",
];

interface AnalysisResult {
  score: number;
  verdict: string;
  autopsy: string[];
  tell: string;
  roast: string;
}

export default function Home() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("");
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState("");

  const analyze = useCallback(async () => {
    const trimmed = text.trim();
    if (trimmed.length < 50) {
      setError("Please enter at least 50 characters.");
      return;
    }
    if (trimmed.length > 5000) {
      setError("Text must be 5000 characters or less.");
      return;
    }

    setError("");
    setResult(null);
    setLoading(true);

    // Cycle loading messages
    let msgIdx = 0;
    setLoadingMsg(LOADING_MESSAGES[0]);
    const interval = setInterval(() => {
      msgIdx = (msgIdx + 1) % LOADING_MESSAGES.length;
      setLoadingMsg(LOADING_MESSAGES[msgIdx]);
    }, 2000);

    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: trimmed }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong.");
        return;
      }

      setResult(data);
    } catch {
      setError("Failed to connect. Please try again.");
    } finally {
      clearInterval(interval);
      setLoading(false);
    }
  }, [text]);

  const charCount = text.trim().length;

  return (
    <main className="min-h-screen flex flex-col items-center px-4 py-12 md:py-20">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="text-center mb-10"
      >
        <h1
          className="glitch-text text-5xl md:text-7xl lg:text-8xl font-bold mb-4"
          data-text="WasThatAI?"
        >
          WasThatAI?
        </h1>
        <p className="text-slate-400 text-lg md:text-xl max-w-md mx-auto">
          Paste anything. Get the brutal truth.
        </p>
      </motion.div>

      {/* Textarea */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
        className="w-full max-w-2xl"
      >
        <div className="relative">
          <textarea
            value={text}
            onChange={(e) => {
              setText(e.target.value);
              setError("");
            }}
            placeholder="Paste your suspicious text here..."
            className="w-full h-48 md:h-56 bg-white/5 border border-white/10 rounded-xl px-5 py-4 text-slate-200 placeholder-slate-600 resize-none focus:border-neon-purple/50 focus:ring-1 focus:ring-neon-purple/30 transition-all text-base"
            maxLength={5000}
            disabled={loading}
          />
          <div className="absolute bottom-3 right-4 text-xs text-slate-600">
            <span className={charCount < 50 ? "text-red-400/70" : "text-slate-500"}>
              {charCount}
            </span>
            /5000
          </div>
        </div>

        {/* Error */}
        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="text-red-400 text-sm mt-2"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>

        {/* Analyze Button */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={analyze}
          disabled={loading || charCount < 50}
          className="mt-4 w-full py-3.5 rounded-xl font-semibold text-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed bg-gradient-to-r from-neon-purple to-neon-cyan text-white shadow-lg shadow-neon-purple/20 hover:shadow-neon-purple/40"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
              />
              {loadingMsg}
            </span>
          ) : (
            "Analyze"
          )}
        </motion.button>
      </motion.div>

      {/* Result */}
      <AnimatePresence>
        {result && (
          <ResultCard
            result={result}
            onClose={() => {
              setResult(null);
              setText("");
            }}
          />
        )}
      </AnimatePresence>

      {/* Footer */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1 }}
        className="mt-auto pt-12 text-center text-slate-600 text-sm"
      >
        Built for vibes, not accuracy. Don&apos;t sue us.
      </motion.footer>
    </main>
  );
}
