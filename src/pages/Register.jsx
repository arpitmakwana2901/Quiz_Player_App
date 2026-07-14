import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, User, AlertCircle, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  // Input states
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI States
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Clear previous errors
    setError(null);

    // 1. Basic Client Validations
    if (!fullName.trim() || fullName.trim().length < 2) {
      setError('Full Name is required and must be at least 2 characters.');
      return;
    }
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    // 2. Register flow
    setLoading(true);
    try {
      await register(fullName, email, password);
      toast.success("Account created successfully! Welcome.");
      navigate('/');
    } catch (err) {
      console.error(err);
      let errorMsg = 'An error occurred during registration. Please try again.';
      // Map Firebase Errors to readable formatting
      if (err.code === 'auth/email-already-in-use') {
        errorMsg = 'This email address is already registered.';
      } else if (err.code === 'auth/invalid-email') {
        errorMsg = 'Please enter a valid email address.';
      } else if (err.code === 'auth/weak-password') {
        errorMsg = 'Password is too weak. Please use at least 6 characters.';
      } else if (err.code === 'auth/network-request-failed') {
        errorMsg = 'Network error. Please check your internet connection.';
      }
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto px-4 py-8 sm:py-16">
      <motion.div
        className="glass p-6 sm:p-10 rounded-3xl shadow-xl border border-slate-200/50 dark:border-slate-800/40"
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100 mb-1.5">
            Create Account
          </h2>
          <p className="text-xs text-slate-500 dark:text-dark-text-muted">
            Sign up to play quizzes and claim scoreboard ranks
          </p>
        </div>

        {error && (
          <div className="mb-5 p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span className="font-semibold">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Full Name field */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-2">
              Full Name
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="e.g. Marie Curie"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={loading}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-500 transition-all dark:border-slate-800 dark:bg-dark-bg dark:text-slate-100"
                required
              />
            </div>
          </div>

          {/* Email field */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-2">
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={loading}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-500 transition-all dark:border-slate-800 dark:bg-dark-bg dark:text-slate-100"
                required
              />
            </div>
          </div>

          {/* Password field */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-2">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                placeholder="Min 6 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={loading}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-500 transition-all dark:border-slate-800 dark:bg-dark-bg dark:text-slate-100"
                required
              />
            </div>
          </div>

          {/* Confirm Password field */}
          <div>
            <label className="block text-[10px] font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-2">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="password"
                placeholder="Repeat password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={loading}
                className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-500 transition-all dark:border-slate-800 dark:bg-dark-bg dark:text-slate-100"
                required
              />
            </div>
          </div>

          {/* Submit button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full inline-flex items-center justify-center gap-2 py-3 rounded-2xl font-bold text-xs tracking-wider uppercase shadow-md transition-all mt-2 cursor-pointer ${
              !loading
                ? 'bg-slate-900 hover:bg-violet-600 text-white hover:shadow-violet-500/10 active:scale-98 dark:bg-violet-600 dark:hover:bg-violet-700'
                : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed dark:bg-dark-card dark:border-slate-800 dark:text-slate-600 dark:shadow-none'
            }`}
          >
            {loading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>Creating Account...</span>
              </>
            ) : (
              <span>Register</span>
            )}
          </button>
        </form>

        <div className="text-center mt-6 pt-5 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-dark-text-muted">
          Already have an account?{' '}
          <Link
            to="/login"
            className="font-bold text-violet-600 dark:text-violet-400 hover:underline"
          >
            Login here
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
