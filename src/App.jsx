import React, { Suspense, useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import ProtectedRoute from './components/ProtectedRoute';
import ErrorBoundary from './components/ErrorBoundary';
import InstallPrompt from './components/InstallPrompt';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AnimatePresence } from 'framer-motion';
import { ToastContainer, toast } from 'react-toastify';
import { Loader2 } from 'lucide-react';
import { useRegisterSW } from 'virtual:pwa-register/react';

// Import Toastify default stylesheet
import 'react-toastify/dist/ReactToastify.css';

// Lazy-loaded pages
const QuizList = React.lazy(() => import('./pages/QuizList'));
const QuizPlay = React.lazy(() => import('./pages/QuizPlay'));
const QuizResult = React.lazy(() => import('./pages/QuizResult'));
const Login = React.lazy(() => import('./pages/Login'));
const Register = React.lazy(() => import('./pages/Register'));
const Profile = React.lazy(() => import('./pages/Profile'));
const History = React.lazy(() => import('./pages/History'));
const AdminPanel = React.lazy(() => import('./pages/AdminPanel'));
const Offline = React.lazy(() => import('./pages/Offline'));

// Reusable Suspense fallback spinner
const LoadingFallback = () => (
  <div className="min-h-[70vh] flex flex-col items-center justify-center gap-3">
    <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />
    <span className="text-sm font-semibold text-slate-500 dark:text-dark-text-muted">
      Loading page...
    </span>
  </div>
);

export default function App() {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);

  // 1. VitePWA Service Worker Update controller
  const {
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegistered(r) {
      console.log('SW registered successfully:', r);
    },
    onRegisterError(error) {
      console.error('SW registration failed:', error);
    }
  });

  // 2. Alert user when new deployment updates are ready
  useEffect(() => {
    if (needRefresh) {
      toast.info(
        <div className="flex flex-col gap-2 p-1">
          <p className="font-bold text-xs text-white">A new version of BrainQuest is available!</p>
          <button 
            onClick={() => updateServiceWorker(true)}
            className="w-fit py-1.5 px-3 bg-white text-slate-900 font-extrabold text-[9px] uppercase rounded-xl hover:bg-slate-100 active:scale-95 transition-all cursor-pointer shadow-sm"
          >
            Update & Reload
          </button>
        </div>,
        { 
          position: "top-right",
          autoClose: false, 
          closeOnClick: false, 
          closeButton: false,
          draggable: false
        }
      );
    }
  }, [needRefresh, updateServiceWorker]);

  // 3. Monitor internet connection status
  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      toast.success("You are back online! Syncing leaderboards...", {
        position: "top-right",
        autoClose: 3000
      });
    };

    const handleOffline = () => {
      setIsOffline(true);
      toast.warning("Connection lost. Operating in offline cached mode.", {
        position: "top-right",
        autoClose: 5000
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <Router>
            <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-dark-bg text-slate-800 dark:text-slate-100 transition-colors duration-300">
              {/* Navigation Header */}
              <Header />

              {/* Main Workspace Area with Suspense for Lazy Loading */}
              <main className="flex-grow">
                <Suspense fallback={<LoadingFallback />}>
                  <AnimatePresence mode="wait">
                    {isOffline ? (
                      <Offline />
                    ) : (
                      <Routes>
                        {/* Quiz Listing Page (Public) */}
                        <Route path="/" element={<QuizList />} />

                        {/* Login & Register Pages (Public) */}
                        <Route path="/login" element={<Login />} />
                        <Route path="/register" element={<Register />} />
                        
                        {/* Quiz Playing Page (Protected) */}
                        <Route 
                          path="/quiz/:id" 
                          element={
                            <ProtectedRoute>
                              <QuizPlay />
                            </ProtectedRoute>
                          } 
                        />
                        
                        {/* Quiz Results and Scoreboard Page (Protected) */}
                        <Route 
                          path="/quiz/:id/result" 
                          element={
                            <ProtectedRoute>
                              <QuizResult />
                            </ProtectedRoute>
                          } 
                        />

                        {/* User Profile Page (Protected) */}
                        <Route 
                          path="/profile" 
                          element={
                            <ProtectedRoute>
                              <Profile />
                            </ProtectedRoute>
                          } 
                        />

                        {/* Quiz History log Page (Protected) */}
                        <Route 
                          path="/history" 
                          element={
                            <ProtectedRoute>
                              <History />
                            </ProtectedRoute>
                          } 
                        />

                        {/* Admin Panel (Protected + Admin Role Guarded) */}
                        <Route 
                          path="/admin" 
                          element={
                            <ProtectedRoute adminOnly={true}>
                              <AdminPanel />
                            </ProtectedRoute>
                          } 
                        />

                        {/* Dedicated offline route */}
                        <Route path="/offline" element={<Offline />} />
                        
                        {/* Fallback route */}
                        <Route path="*" element={<Navigate to="/" replace />} />
                      </Routes>
                    )}
                  </AnimatePresence>
                </Suspense>
              </main>

              {/* Global Footer */}
              <footer className="w-full border-t border-slate-200/50 dark:border-slate-800/40 py-6 text-center text-xs text-slate-400 dark:text-dark-text-muted transition-colors duration-300">
                <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <p>© {new Date().getFullYear()} BrainQuest. All rights reserved.</p>
                  <div className="flex gap-4">
                    <span className="font-semibold">Designed for Learning</span>
                    <span>•</span>
                    <span className="font-semibold">Powered by React & Tailwind</span>
                  </div>
                </div>
              </footer>
            </div>
            
            {/* Custom Install App Floating Banner */}
            <InstallPrompt />
          </Router>
        </AuthProvider>
      </ThemeProvider>

      {/* React Toastify Notifications Container */}
      <ToastContainer
        position="top-right"
        autoClose={3500}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </ErrorBoundary>
  );
}
