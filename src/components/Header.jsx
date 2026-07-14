import React, { useState } from 'react';
import { Brain, LogOut, LogIn, UserPlus, Menu, X, Download } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePWA } from '../hooks/usePWA';
import ThemeToggle from './ThemeToggle';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-toastify';

export default function Header() {
  const { currentUser, userData, logout } = useAuth();
  const { isInstallable, isStandalone, installApp } = usePWA();
  const navigate = useNavigate();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      setIsMobileMenuOpen(false);
      toast.success("Logged out successfully.");
      navigate('/login');
    } catch (error) {
      console.error("Logout failed:", error);
      toast.error("Logout failed. Please try again.");
    }
  };

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Leaderboard', path: '/' }
  ];

  if (currentUser) {
    navLinks.push({ label: 'Profile', path: '/profile' });
    if (userData?.role === 'admin' || userData?.isAdmin) {
      navLinks.push({ label: 'Admin Panel', path: '/admin' });
    }
  }

  return (
    <header className="sticky top-0 z-50 w-full glass border-b border-slate-200/50 dark:border-slate-800/40 px-4 sm:px-6 py-4 transition-colors duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        
        {/* Brand logo & home link */}
        <Link to="/" className="flex items-center gap-2 group" onClick={() => setIsMobileMenuOpen(false)}>
          <div className="p-2 rounded-xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white shadow-md shadow-violet-500/25 group-hover:scale-105 transition-transform duration-200">
            <Brain className="w-5.5 h-5.5 animate-pulse" />
          </div>
          <div>
            <span className="font-extrabold text-lg sm:text-xl tracking-tight bg-gradient-to-r from-violet-600 to-fuchsia-600 dark:from-violet-400 dark:to-fuchsia-400 bg-clip-text text-transparent">
              BrainQuest
            </span>
            <span className="hidden sm:block text-[9px] text-slate-500 dark:text-dark-text-muted font-bold tracking-wider uppercase">
              Interactive Quiz Player
            </span>
          </div>
        </Link>

        {/* Desktop Navigation Links */}
        <div className="hidden md:flex items-center gap-6">
          <nav className="flex items-center gap-5 text-xs font-bold text-slate-600 dark:text-slate-300">
            {navLinks.map((link, idx) => (
              <Link 
                key={idx} 
                to={link.path} 
                className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <span className="w-px h-4 bg-slate-200 dark:bg-slate-800/80" />

          {/* Theme & Auth HUD */}
          <div className="flex items-center gap-4">
            {isInstallable && !isStandalone && (
              <button
                onClick={installApp}
                className="inline-flex items-center gap-1.5 py-1.5 px-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-[10px] font-extrabold uppercase tracking-wide cursor-pointer transition-colors shadow-sm active:scale-95"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Install App</span>
              </button>
            )}
            <ThemeToggle />

            {currentUser ? (
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 bg-violet-100/50 dark:bg-violet-950/20 px-3 py-1.5 rounded-xl border border-violet-200/40 dark:border-violet-900/30">
                  Welcome, {userData?.fullName || currentUser.displayName || 'Player'}
                </span>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-rose-950/15 dark:hover:text-rose-400 dark:hover:border-rose-900/40 text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-sm"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Logout</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-dark-border dark:hover:text-slate-100 text-xs font-bold cursor-pointer transition-all"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Login</span>
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center gap-1.5 py-2 px-3.5 rounded-xl bg-slate-950 text-white hover:bg-violet-600 dark:bg-violet-600 dark:hover:bg-violet-700 text-xs font-bold cursor-pointer transition-all active:scale-95 shadow-md"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Register</span>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile controls bar */}
        <div className="flex md:hidden items-center gap-3">
          <ThemeToggle />
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 focus:outline-none dark:border-slate-800 dark:text-slate-400 dark:hover:bg-dark-border cursor-pointer transition-all"
            aria-label="Toggle Navigation Menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Slide-Down Dropdown Menu */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="md:hidden overflow-hidden w-full mt-4"
          >
            <div className="flex flex-col gap-4 py-4 border-t border-slate-200/50 dark:border-slate-800/40">
              {isInstallable && !isStandalone && (
                <div className="px-1 mb-1">
                  <button
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      installApp();
                    }}
                    className="w-full inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-violet-600 text-white font-extrabold text-[10px] uppercase cursor-pointer hover:bg-violet-700 active:scale-95 shadow-sm transition-all"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Install BrainQuest App</span>
                  </button>
                </div>
              )}
              {/* Navigation Links */}
              <nav className="flex flex-col gap-3.5 text-xs font-bold text-slate-600 dark:text-slate-300 px-1">
                {navLinks.map((link, idx) => (
                  <Link
                    key={idx}
                    to={link.path}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="hover:text-violet-600 dark:hover:text-violet-400 transition-colors py-1"
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>

              <hr className="border-slate-100 dark:border-slate-800/60" />

              {/* Mobile Auth actions */}
              <div className="flex flex-col gap-3 px-1">
                {currentUser ? (
                  <div className="space-y-3">
                    <div className="text-xs font-bold text-slate-700 dark:text-slate-200 bg-violet-100/50 dark:bg-violet-950/20 px-3.5 py-2 rounded-xl border border-violet-200/40 dark:border-violet-900/30 w-fit">
                      Welcome, {userData?.fullName || currentUser.displayName || 'Player'}
                    </div>
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-rose-50 hover:text-rose-600 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-rose-950/10 dark:hover:text-rose-400 text-xs font-bold cursor-pointer transition-all active:scale-95"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Logout</span>
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3.5">
                    <Link
                      to="/login"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-dark-border dark:hover:text-slate-100 text-xs font-bold text-center cursor-pointer transition-all"
                    >
                      <LogIn className="w-3.5 h-3.5" />
                      <span>Login</span>
                    </Link>
                    <Link
                      to="/register"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-slate-950 text-white hover:bg-violet-600 dark:bg-violet-600 dark:hover:bg-violet-700 text-xs font-bold text-center cursor-pointer transition-all active:scale-95"
                    >
                      <UserPlus className="w-3.5 h-3.5" />
                      <span>Register</span>
                    </Link>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
