import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { db } from '../firebase/config';
import { 
  BarChart2, Clock, Calendar, Trophy, ChevronRight, HelpCircle, 
  ArrowLeft, RefreshCw, Loader2, Play
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

export default function History() {
  const { currentUser } = useAuth();
  
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    
    const fetchHistory = async () => {
      if (!currentUser) return;
      setLoading(true);
      try {
        const historyColRef = collection(db, 'users', currentUser.uid, 'history');
        const q = query(historyColRef, orderBy('completedAt', 'desc'));
        const querySnapshot = await getDocs(q);
        
        const items = [];
        querySnapshot.forEach((docSnap) => {
          const data = docSnap.data();
          let completedDate = new Date();
          if (data.completedAt) {
            completedDate = typeof data.completedAt.toDate === 'function'
              ? data.completedAt.toDate()
              : new Date(data.completedAt);
          }
          items.push({
            id: docSnap.id,
            ...data,
            completedAt: completedDate
          });
        });

        if (active) {
          setHistory(items);
        }
      } catch (error) {
        console.error("Failed to fetch user attempts history:", error);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchHistory();
    return () => {
      active = false;
    };
  }, [currentUser]);

  // Format completed time string
  const formatDateTime = (date) => {
    return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />
        <span className="text-sm font-semibold text-slate-500 dark:text-dark-text-muted">
          Loading history logs...
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col gap-6 sm:gap-8">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0">
        <div>
          <Link 
            to="/profile" 
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-dark-text-muted dark:hover:text-slate-200 mb-2 group cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Profile</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <BarChart2 className="w-7 h-7 text-violet-500" /> Quiz History Log
          </h1>
          <p className="text-xs text-slate-500 dark:text-dark-text-muted mt-1">
            Complete database of all your registered quiz attempts, sorted by latest first.
          </p>
        </div>
        
        <span className="text-xs font-bold bg-violet-100 text-violet-700 dark:bg-violet-950/20 dark:text-violet-400 px-3 py-1.5 rounded-xl border border-violet-200/40 dark:border-violet-900/30">
          Total attempts: {history.length}
        </span>
      </div>

      {/* History attempts list */}
      {history.length > 0 ? (
        <div className="glass rounded-3xl overflow-hidden shadow-sm border border-slate-200/50 dark:border-slate-800/40">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[650px]">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800/80 text-slate-400 dark:text-dark-text-muted uppercase font-bold text-[9px] tracking-wider bg-slate-50/50 dark:bg-dark-card/20">
                  <th className="py-4 text-center w-16">Attempt</th>
                  <th className="py-4 pl-4">Quiz Name</th>
                  <th className="py-4 text-right w-24">Score</th>
                  <th className="py-4 text-right w-24">Accuracy</th>
                  <th className="py-4 text-right w-36">Duration</th>
                  <th className="py-4 text-center w-28">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 bg-white/10">
                {history.map((attempt) => (
                  <tr key={attempt.id} className="hover:bg-slate-50/40 dark:hover:bg-dark-border/10 transition-colors">
                    <td className="py-4 text-center font-bold text-slate-400 dark:text-dark-text-muted">
                      #{attempt.attemptNumber}
                    </td>
                    <td className="py-4 pl-4">
                      <h4 className="font-bold text-slate-800 dark:text-slate-200 leading-snug">
                        {attempt.quizTitle}
                      </h4>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-1 font-medium">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDateTime(attempt.completedAt)}</span>
                      </div>
                    </td>
                    <td className="py-4 text-right font-extrabold text-slate-800 dark:text-slate-200">
                      {attempt.score} Pts
                    </td>
                    <td className="py-4 text-right">
                      <span className="font-black text-violet-600 dark:text-violet-400 text-sm">
                        {attempt.percentage}%
                      </span>
                      <span className="block text-[10px] text-slate-400 font-medium mt-0.5">
                        {attempt.correctAnswers}/{attempt.totalQuestions} Correct
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-1 font-medium text-slate-600 dark:text-slate-400">
                        <Clock className="w-3 h-3 text-slate-400" />
                        <span>{attempt.timeTaken} seconds</span>
                      </div>
                      <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wide mt-0.5">
                        {attempt.timeTaken > 0 ? Math.round(attempt.timeTaken / attempt.totalQuestions) : 0}s avg / question
                      </span>
                    </td>
                    <td className="py-4 text-center">
                      <Link
                        to={`/quiz/${attempt.quizId}`}
                        className="inline-flex items-center gap-1 py-1.5 px-3.5 rounded-xl bg-slate-900 text-white font-bold text-[10px] uppercase hover:bg-violet-600 dark:bg-violet-600 dark:hover:bg-violet-700 transition-colors active:scale-95 cursor-pointer shadow-sm"
                      >
                        <Play className="w-2.5 h-2.5 fill-white" />
                        <span>Replay</span>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="glass p-12 text-center rounded-3xl max-w-md mx-auto shadow-sm border border-slate-200/50 dark:border-slate-800/40">
          <div className="w-16 h-16 rounded-full bg-violet-50 dark:bg-violet-950/20 flex items-center justify-center mx-auto mb-5 text-violet-600 dark:text-violet-400">
            <BarChart2 className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">No History Logged</h3>
          <p className="text-xs text-slate-500 dark:text-dark-text-muted mb-6 max-w-xs mx-auto leading-relaxed font-semibold">
            You haven't registered any quiz runs yet. Complete a challenge and save your run details to compile your score logs!
          </p>
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 py-2.5 px-6 rounded-xl bg-slate-900 text-white font-semibold text-xs tracking-wide hover:bg-violet-600 active:scale-95 shadow-md transition-all dark:bg-violet-600 dark:hover:bg-violet-700 cursor-pointer"
          >
            <span>Browse Quizzes</span>
          </Link>
        </div>
      )}
    </div>
  );
}
