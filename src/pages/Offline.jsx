import React from 'react';
import { WifiOff, RefreshCw, Home } from 'lucide-react';
import { toast } from 'react-toastify';
import { motion } from 'framer-motion';

export default function Offline() {
  const handleRetry = () => {
    if (navigator.onLine) {
      toast.success("Connection restored! Reloading...");
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      toast.error("You are still offline. Please check your network adapters.");
    }
  };

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="glass p-8 sm:p-10 rounded-3xl max-w-md w-full shadow-xl border border-slate-200/50 dark:border-slate-800/40"
      >
        <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center mx-auto mb-6 text-rose-600 dark:text-rose-400">
          <WifiOff className="w-8 h-8" />
        </div>
        
        <h2 className="text-xl sm:text-2xl font-black text-slate-800 dark:text-slate-100 mb-2">
          No Internet Connection
        </h2>
        <p className="text-xs text-slate-500 dark:text-dark-text-muted mb-8 leading-relaxed max-w-xs mx-auto font-semibold">
          It looks like you are currently offline. Please check your internet connection and click retry to reload.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={handleRetry}
            className="inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-violet-600 dark:bg-violet-600 dark:hover:bg-violet-700 transition-all cursor-pointer active:scale-95"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Retry</span>
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-dark-card dark:text-slate-300 dark:hover:bg-dark-border text-xs font-bold transition-all cursor-pointer active:scale-95"
          >
            <Home className="w-3.5 h-3.5" />
            <span>Go Home</span>
          </a>
        </div>
      </motion.div>
    </div>
  );
}
