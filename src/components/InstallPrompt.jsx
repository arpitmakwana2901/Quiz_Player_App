import React, { useState, useEffect } from 'react';
import { usePWA } from '../hooks/usePWA';
import { Download, X, ArrowRight, Smartphone } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function InstallPrompt() {
  const { isInstallable, installApp } = usePWA();
  const [isDismissed, setIsDismissed] = useState(false);

  useEffect(() => {
    // Check if dismissed in current session
    const dismissed = sessionStorage.getItem('pwa_install_dismissed') === 'true';
    setIsDismissed(dismissed);
  }, []);

  const handleDismiss = (e) => {
    e.stopPropagation();
    sessionStorage.setItem('pwa_install_dismissed', 'true');
    setIsDismissed(true);
  };

  const handleInstall = async () => {
    const success = await installApp();
    if (success) {
      sessionStorage.setItem('pwa_install_dismissed', 'true');
      setIsDismissed(true);
    }
  };

  return (
    <AnimatePresence>
      {isInstallable && !isDismissed && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
          className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-sm z-50"
        >
          <div className="glass p-5 rounded-3xl border border-slate-200/60 dark:border-slate-800/40 shadow-2xl flex items-start gap-3.5 relative overflow-hidden bg-white/95 dark:bg-dark-card/95">
            {/* Colored background glow */}
            <div className="absolute top-[-50%] left-[-50%] w-32 h-32 rounded-full bg-violet-500/10 blur-xl pointer-events-none" />
            
            <div className="p-3 rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-500/20 flex-shrink-0">
              <Smartphone className="w-5 h-5 animate-pulse" />
            </div>

            <div className="flex-grow pr-6">
              <h4 className="text-xs font-black text-slate-800 dark:text-slate-100">
                Install BrainQuest
              </h4>
              <p className="text-[10px] text-slate-500 dark:text-dark-text-muted mt-1 leading-relaxed">
                Add BrainQuest to your home screen for quick launch and offline capabilities.
              </p>
              
              <div className="flex gap-3 items-center mt-3">
                <button
                  onClick={handleInstall}
                  className="inline-flex items-center gap-1 py-1.5 px-3.5 rounded-xl bg-slate-950 text-white font-bold text-[10px] uppercase hover:bg-violet-600 dark:bg-violet-600 dark:hover:bg-violet-700 transition-colors shadow-sm cursor-pointer active:scale-95"
                >
                  <Download className="w-3 h-3" />
                  <span>Install App</span>
                </button>
                <button
                  onClick={handleDismiss}
                  className="text-[10px] font-bold text-slate-400 dark:text-dark-text-muted hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                >
                  Maybe Later
                </button>
              </div>
            </div>

            {/* Close button */}
            <button
              onClick={handleDismiss}
              className="absolute top-3 right-3 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-border cursor-pointer transition-colors"
              aria-label="Close prompt"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
