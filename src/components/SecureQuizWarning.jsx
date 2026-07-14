import React from 'react';
import { AlertTriangle, Shield, Play } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

/**
 * Overlay warning dialog displayed to the user when an anti-cheat violation occurs.
 */
export default function SecureQuizWarning({ isOpen, reason, warningsRemaining, onResume }) {
  if (!isOpen) return null;

  // Map machine reasons to user-friendly messages
  const getReasonMessage = () => {
    switch (reason) {
      case 'fullscreen_exit':
        return "Exiting fullscreen mode is not allowed during the quiz.";
      case 'tab_switch':
        return "Switching tabs or minimizing the browser is not allowed during the quiz.";
      case 'window_blur':
        return "Loss of window focus (clicking outside the quiz window) is not allowed.";
      case 'devtools_attempt':
      case 'devtools_docked':
        return "Accessing developer tools console or debugger is strictly prohibited.";
      default:
        return "Suspicious browser activity detected.";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="glass p-6 sm:p-8 rounded-3xl max-w-md w-full text-center shadow-2xl border border-rose-500/20 dark:border-rose-500/10 bg-white/95 dark:bg-dark-card/95"
      >
        <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center mx-auto mb-5 text-rose-600 dark:text-rose-400">
          <AlertTriangle className="w-8 h-8 animate-bounce" />
        </div>

        <h3 className="text-lg font-black text-slate-800 dark:text-slate-100 flex items-center justify-center gap-1.5">
          <Shield className="w-5 h-5 text-rose-500" /> Proctor Warning
        </h3>
        
        <p className="text-xs text-rose-600 dark:text-rose-400 font-bold mt-2">
          {getReasonMessage()}
        </p>

        <p className="text-[11px] text-slate-400 dark:text-dark-text-muted mt-2 leading-relaxed">
          Please return to fullscreen to resume the challenge. Leaving fullscreen or switching tabs again will result in automatic submission.
        </p>

        {/* Warnings remaining counter */}
        <div className="my-6 p-4 bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-900/20 rounded-2xl">
          <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-dark-text-muted block">
            Warnings Remaining
          </span>
          <span className="text-3xl font-black text-rose-600 mt-1 block">
            {warningsRemaining}
          </span>
        </div>

        <button
          onClick={onResume}
          className="w-full inline-flex items-center justify-center gap-1.5 py-3 rounded-2xl bg-slate-900 hover:bg-violet-600 text-white font-bold text-xs uppercase tracking-wide cursor-pointer transition-colors shadow-sm active:scale-95 dark:bg-violet-600 dark:hover:bg-violet-700"
        >
          <Play className="w-3.5 h-3.5 fill-white" />
          <span>Resume Monitored Quiz</span>
        </button>
      </motion.div>
    </div>
  );
}
