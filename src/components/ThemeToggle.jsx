import React from 'react';
import { useTheme } from '../hooks/useTheme';
import { Sun, Moon } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className="p-2.5 rounded-xl border border-slate-200/60 bg-white/40 text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500/25 dark:border-slate-800/40 dark:bg-dark-card/40 dark:text-slate-400 dark:hover:bg-dark-border dark:hover:text-slate-100 cursor-pointer relative overflow-hidden transition-all shadow-sm active:scale-95"
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} theme`}
    >
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={theme}
          initial={{ y: -20, opacity: 0, rotate: -90 }}
          animate={{ y: 0, opacity: 1, rotate: 0 }}
          exit={{ y: 20, opacity: 0, rotate: 90 }}
          transition={{ duration: 0.18 }}
          className="flex items-center justify-center"
        >
          {isDark ? (
            <Sun className="w-4 h-4 text-amber-400 animate-spin-slow" />
          ) : (
            <Moon className="w-4 h-4 text-violet-600" />
          )}
        </motion.div>
      </AnimatePresence>
    </button>
  );
}
