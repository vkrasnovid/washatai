"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

interface AnalysisResult {
  score: number;
  verdict: string;
  autopsy: string[];
  tell: string;
  roast: string;
}

function getScoreColor(score: number): string {
  if (score >= 75) return "text-red-400";
  if (score >= 50) return "text-yellow-400";
  if (score >= 25) return "text-emerald-400";
  return "text-green-400";
}

function getScoreBg(score: number): string {
  if (score >= 75) return "from-red-500/20 to-red-900/10 border-red-500/30";
  if (score >= 50) return "from-yellow-500/20 to-yellow-900/10 border-yellow-500/30";
  if (score >= 25) return "from-emerald-500/20 to-emerald-900/10 border-emerald-500/30";
  return "from-green-500/20 to-green-900/10 border-green-500/30";
}

function getVerdictEmoji(verdict: string): string {
  if (verdict.includes("DEFINITELY AI")) return "🤖";
  if (verdict.includes("PROBABLY AI")) return "🤖";
  if (verdict.includes("SUSPICIOUS")) return "👽";
  if (verdict.includes("FEELS HUMAN")) return "👤";
  if (verdict.includes("DEFINITELY HUMAN")) return "👤";
  return "🔍";
}

function AnimatedScore({ target }: { target: number }) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    let frame: number;
    const duration = 1500;
    const start = performance.now();

    function animate(now: number) {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrent(Math.round(eased * target));
      if (progress < 1) {
        frame = requestAnimationFrame(animate);
      }
    }

    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [target]);

  return <>{current}</>;
}

export default function ResultCard({
  result,
  onClose,
}: {
  result: AnalysisResult;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  const handleShare = () => {
    const text = `My text scored ${result.score}% AI on WasThatAI? ${getVerdictEmoji(result.verdict)} Check yours!`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={`mt-8 w-full max-w-2xl mx-auto rounded-2xl border bg-gradient-to-b p-6 md:p-8 ${getScoreBg(result.score)}`}
      >
        {/* Score */}
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="text-center mb-6"
        >
          <div className={`text-7xl md:text-8xl font-bold ${getScoreColor(result.score)}`}>
            <AnimatedScore target={result.score} />
            <span className="text-3xl md:text-4xl">%</span>
          </div>
          <div className="text-lg text-slate-400 mt-1">AI vibes</div>
        </motion.div>

        {/* Verdict */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="text-center mb-6"
        >
          <span className="inline-block px-4 py-2 rounded-full bg-white/5 border border-white/10 text-xl font-semibold tracking-wide">
            {result.verdict} {getVerdictEmoji(result.verdict)}
          </span>
        </motion.div>

        {/* Roast */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center text-neon-purple italic text-lg mb-6"
        >
          &ldquo;{result.roast}&rdquo;
        </motion.p>

        {/* Personality Autopsy */}
        <div className="mb-6">
          <h3 className="text-sm uppercase tracking-widest text-slate-500 mb-3">
            Personality Autopsy
          </h3>
          <ul className="space-y-2">
            {result.autopsy.map((point, i) => (
              <motion.li
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 + i * 0.15 }}
                className="flex items-start gap-2 text-slate-300"
              >
                <span className="text-neon-cyan mt-0.5">▸</span>
                <span>{point}</span>
              </motion.li>
            ))}
          </ul>
        </div>

        {/* The Tell */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
          className="mb-6"
        >
          <h3 className="text-sm uppercase tracking-widest text-slate-500 mb-2">
            The Tell
          </h3>
          <div className="rounded-lg bg-white/5 border border-neon-purple/30 px-4 py-3">
            <p className="text-neon-purple font-medium italic">
              &ldquo;{result.tell}&rdquo;
            </p>
          </div>
        </motion.div>

        {/* Actions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.1 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <button
            onClick={handleShare}
            className="px-6 py-2.5 rounded-lg bg-neon-purple/20 border border-neon-purple/40 text-neon-purple font-medium hover:bg-neon-purple/30 transition-colors"
          >
            {copied ? "Copied! ✓" : "Share Card 📋"}
          </button>
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-lg bg-white/5 border border-white/10 text-slate-400 font-medium hover:bg-white/10 transition-colors"
          >
            Try Another
          </button>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
