import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Loader2 } from 'lucide-react';

export default function ProtectedRoute({ children, adminOnly = false }) {
  const { currentUser, userData, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />
        <span className="text-sm font-semibold text-slate-500 dark:text-dark-text-muted">
          Verifying authorization...
        </span>
      </div>
    );
  }

  // Redirect to login if user is not authenticated
  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  // Redirect to home if path requires admin role and user is not admin
  if (adminOnly && userData?.role !== 'admin' && !userData?.isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
}
