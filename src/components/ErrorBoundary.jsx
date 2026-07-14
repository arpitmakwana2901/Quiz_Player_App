import React, { Component } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

export default class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an unhandled runtime error:", error, errorInfo);
  }

  handleRefresh = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-slate-50 dark:bg-dark-bg text-slate-800 dark:text-slate-100 transition-colors duration-300">
          <div className="glass p-8 sm:p-10 rounded-3xl max-w-md w-full text-center shadow-xl border border-slate-200/50 dark:border-slate-800/40">
            <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center mx-auto mb-6 text-rose-600 dark:text-rose-400">
              <AlertTriangle className="w-8 h-8" />
            </div>
            <h1 className="text-2xl font-black text-slate-800 dark:text-slate-100 mb-3">
              Something went wrong
            </h1>
            <p className="text-xs text-slate-500 dark:text-dark-text-muted mb-8 leading-relaxed font-semibold">
              An unexpected runtime error occurred. Try refreshing the page or going back to the home dashboard.
            </p>
            {this.state.error && (
              <pre className="text-[10px] bg-rose-50/50 dark:bg-rose-950/10 text-rose-700 dark:text-rose-400 p-3.5 rounded-2xl mb-8 overflow-x-auto text-left font-mono border border-rose-200/40 dark:border-rose-900/30 max-h-32">
                {this.state.error.toString()}
              </pre>
            )}
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={this.handleRefresh}
                className="inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-dark-card dark:text-slate-300 dark:hover:bg-dark-border text-xs font-bold transition-all cursor-pointer active:scale-95"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Page</span>
              </button>
              <button
                onClick={this.handleGoHome}
                className="inline-flex items-center justify-center gap-1.5 py-2.5 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-violet-600 dark:bg-violet-600 dark:hover:bg-violet-700 transition-all cursor-pointer active:scale-95"
              >
                <Home className="w-3.5 h-3.5" />
                <span>Go Home</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
