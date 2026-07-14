import React, { useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate, Link } from 'react-router-dom';
import { saveScore, getTopScores } from '../firebase/leaderboard';
import { useAuth } from '../context/AuthContext';
import { 
  collection, addDoc, serverTimestamp, doc, updateDoc, getDocs, query, where 
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { toast } from 'react-toastify';
import { 
  Award, CheckCircle2, XCircle, RefreshCw, Home, ChevronDown, ChevronUp, 
  Send, Trophy, Calendar, Medal, Clock, AlertCircle, User, Loader2
} from 'lucide-react';
import { motion } from 'framer-motion';

export default function QuizResult() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { currentUser, userData } = useAuth();

  // Retrieve game metrics from router state
  const stats = location.state;

  // Local component states
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  
  const [leaderboard, setLeaderboard] = useState([]);
  const [isLoadingLeaderboard, setIsLoadingLeaderboard] = useState(true);
  const [leaderboardError, setLeaderboardError] = useState(null);
  
  const [showReview, setShowReview] = useState(false);

  const quizId = id;

  // Fetch top 10 scores on mount or after submission
  const fetchLeaderboard = async () => {
    setIsLoadingLeaderboard(true);
    setLeaderboardError(null);
    try {
      const topScores = await getTopScores(quizId);
      setLeaderboard(topScores);
    } catch (err) {
      console.error("Failed to load leaderboard scores:", err);
      if (err.message && err.message.includes('FAILED_PRECONDITION')) {
        setLeaderboardError('The database index is currently being built. Please wait a minute and retry.');
      } else {
        setLeaderboardError('Could not load leaderboard scores. Please verify your Firestore rules/connection.');
      }
    } finally {
      setIsLoadingLeaderboard(false);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [quizId, isSubmitted]);

  // Safe check if page was accessed directly without stats
  if (!stats) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-violet-50 dark:bg-violet-950/20 flex items-center justify-center mx-auto mb-5 text-violet-600 dark:text-violet-400">
          <Trophy className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">No Results Available</h2>
        <p className="text-sm text-slate-500 dark:text-dark-text-muted mb-6 leading-relaxed">
          Please play a quiz first to see results.
        </p>
        <Link
          to="/"
          className="inline-flex items-center gap-1.5 py-2.5 px-6 rounded-xl bg-slate-900 text-white font-semibold text-xs tracking-wide hover:bg-violet-600 active:scale-95 transition-all dark:bg-violet-600 dark:hover:bg-violet-700"
        >
          <span>Go to Home</span>
        </Link>
      </div>
    );
  }

  const { score, correctCount, wrongCount, percentage, answersHistory, quizTitle } = stats;

  // Generate performance message
  let feedback = {
    message: "Keep learning!",
    description: "Review the explanations below and try again. You'll get it next time!",
    color: "from-rose-500 to-red-600",
    badgeColor: "bg-rose-100 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400"
  };

  if (percentage >= 90) {
    feedback = {
      message: "Grandmaster!",
      description: "Incredible score! You have completely mastered this topic. Simply outstanding!",
      color: "from-amber-500 to-orange-600",
      badgeColor: "bg-amber-100 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400"
    };
  } else if (percentage >= 70) {
    feedback = {
      message: "Great Job!",
      description: "Wonderful! You have a solid grasp of this material. Keep it up!",
      color: "from-emerald-500 to-teal-600",
      badgeColor: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/20 dark:text-emerald-400"
    };
  } else if (percentage >= 50) {
    feedback = {
      message: "Good Effort!",
      description: "Decent score! A tiny bit of review and you will easily score higher.",
      color: "from-violet-500 to-indigo-600",
      badgeColor: "bg-violet-100 text-violet-700 dark:bg-violet-950/20 dark:text-violet-400"
    };
  }

  // Handle Score Submission using User Display Name from Auth
  const handleSubmitScore = async (e) => {
    e.preventDefault();
    
    // Obtain display name from authenticated context
    const displayName = currentUser?.displayName || 'Player';
    if (!displayName.trim() || displayName.trim().length < 2) {
      setSubmitError('Your profile name must be at least 2 characters long.');
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    try {
      // 1. Get attempts count for this quiz to determine attempt number
      const historyColRef = collection(db, 'users', currentUser.uid, 'history');
      const attemptQuery = query(historyColRef, where('quizId', '==', quizId));
      const attemptSnap = await getDocs(attemptQuery);
      const attemptNumber = attemptSnap.size + 1;

      // 2. Save attempt to history subcollection
      const attemptData = {
        quizId,
        quizTitle,
        score: Number(score),
        percentage: Number(percentage),
        correctAnswers: Number(correctCount),
        wrongAnswers: Number(wrongCount),
        totalQuestions: answersHistory.length,
        completedAt: serverTimestamp(),
        timeTaken: Number(stats.timeTaken || 0),
        attemptNumber
      };
      await addDoc(historyColRef, attemptData);

      // 3. Update recently played quizzes (latest 5) in user's profile doc
      const userDocRef = doc(db, 'users', currentUser.uid);
      const currentRecent = userData?.recentlyPlayed || [];
      const filteredRecent = currentRecent.filter(item => item.quizId !== quizId);
      const updatedRecent = [
        {
          quizId,
          title: quizTitle,
          category: stats.quizCategory || 'Programming',
          score: Number(score),
          percentage: Number(percentage),
          playedAt: new Date().toISOString()
        },
        ...filteredRecent
      ].slice(0, 5);

      await updateDoc(userDocRef, {
        recentlyPlayed: updatedRecent
      });

      // 4. Save to global leaderboard
      await saveScore(displayName.trim(), quizId, quizTitle, score, percentage);

      setIsSubmitted(true);
      toast.success("Score and run details saved successfully!");
    } catch (err) {
      console.error(err);
      setSubmitError(err.message || 'Failed to submit score. Please check your internet connection and try again.');
      toast.error("Failed to save score. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to format rank badge
  const renderRankBadge = (index) => {
    if (index === 0) return <Trophy className="w-5 h-5 text-amber-500 fill-amber-300" />;
    if (index === 1) return <Medal className="w-5 h-5 text-slate-400 fill-slate-200" />;
    if (index === 2) return <Medal className="w-5 h-5 text-amber-700 fill-amber-600" />;
    return <span className="text-xs font-bold text-slate-400 dark:text-dark-text-muted">#{index + 1}</span>;
  };

  // Format completed time string
  const formatCompletedAt = (dateObj) => {
    if (!dateObj) return '';
    try {
      const date = new Date(dateObj);
      return `${date.toLocaleDateString()} at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } catch (e) {
      return '';
    }
  };

  return (
    <motion.div
      className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col gap-8"
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4 }}
    >
      {/* Score Summary Box */}
      <section className="glass rounded-3xl overflow-hidden shadow-lg border border-slate-200/50 dark:border-slate-800/40">
        <div className={`p-6 sm:p-10 bg-gradient-to-br ${feedback.color} text-white text-center relative overflow-hidden`}>
          {/* Decorative floating rings */}
          <div className="absolute top-[-30%] left-[-10%] w-56 h-56 rounded-full bg-white/10 blur-md" />
          <div className="absolute bottom-[-20%] right-[-10%] w-72 h-72 rounded-full bg-white/10 blur-lg" />
          
          <h1 className="text-[10px] font-extrabold uppercase tracking-widest text-white/70 mb-2">
            Quiz Finished • {quizTitle}
          </h1>
          <h2 className="text-3xl sm:text-5xl font-black mb-2 animate-bounce">
            {percentage}%
          </h2>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight mb-2">
            {feedback.message}
          </h3>
          <p className="text-xs sm:text-sm text-white/90 max-w-md mx-auto leading-relaxed">
            {feedback.description}
          </p>
        </div>

        {/* Stats metrics line */}
        <div className="grid grid-cols-3 divide-x divide-slate-100 dark:divide-slate-800/80 bg-white/50 dark:bg-dark-card/50 py-5 text-center">
          <div>
            <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 dark:text-dark-text-muted block">
              Final Score
            </span>
            <span className="text-base font-extrabold text-slate-800 dark:text-slate-200">
              {score} Pts
            </span>
          </div>
          <div>
            <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 dark:text-dark-text-muted block">
              Correct
            </span>
            <span className="text-base font-extrabold text-emerald-600 dark:text-emerald-400">
              {correctCount}
            </span>
          </div>
          <div>
            <span className="text-[9px] uppercase tracking-wider font-bold text-slate-400 dark:text-dark-text-muted block">
              Incorrect / Skipped
            </span>
            <span className="text-base font-extrabold text-rose-500">
              {wrongCount}
            </span>
          </div>
        </div>
      </section>

      {/* Action CTA Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
        <Link
          to={`/quiz/${quizId}`}
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-6 rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white font-bold text-sm shadow-md hover:shadow-violet-500/20 active:scale-95 transition-all cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Play Again</span>
        </Link>
        <Link
          to="/"
          className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3 px-6 rounded-2xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-dark-card dark:text-slate-300 dark:hover:bg-dark-border cursor-pointer transition-all"
        >
          <Home className="w-4 h-4" />
          <span>Back to Quizzes</span>
        </Link>
      </div>

      {/* Leaderboard Submission & Display */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-6 sm:gap-8 items-start">
        {/* Left Column: Submit Score Form */}
        <div className="glass p-6 rounded-3xl shadow-sm border border-slate-200/50 dark:border-slate-800/40 md:col-span-5 h-full">
          <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 mb-2 flex items-center gap-1.5">
            <Award className="w-5 h-5 text-violet-500" /> Save Your Run
          </h3>
          <p className="text-xs text-slate-500 dark:text-dark-text-muted leading-relaxed mb-4">
            Record your score to the global leaderboards and see how you stack up against the competition.
          </p>

          {submitError && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{submitError}</span>
            </div>
          )}

          {isSubmitted ? (
            <div className="bg-emerald-50/50 dark:bg-emerald-950/10 border border-emerald-100 dark:border-emerald-900/30 rounded-2xl p-5 text-center animate-fade-in">
              <CheckCircle2 className="w-8 h-8 text-emerald-600 dark:text-emerald-400 mx-auto mb-2" />
              <h4 className="text-sm font-bold text-emerald-800 dark:text-emerald-400">Score Saved!</h4>
              <p className="text-[11px] text-slate-500 dark:text-dark-text-muted mt-1">
                Your rank has been updated on the scoreboard to the right.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmitScore} className="space-y-4">
              <div className="p-3.5 bg-slate-100/50 border border-slate-200/60 dark:bg-dark-bg/30 dark:border-slate-800 rounded-2xl flex items-center gap-3">
                <div className="p-2 rounded-xl bg-violet-600/10 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <span className="block text-[9px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-dark-text-muted">
                    Submitting As
                  </span>
                  <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                    {currentUser?.displayName || 'Player'}
                  </span>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-2xl font-bold text-xs tracking-wider uppercase shadow-md transition-all cursor-pointer ${
                  !isSubmitting
                    ? 'bg-slate-900 hover:bg-violet-600 text-white hover:shadow-violet-500/10 active:scale-95 dark:bg-violet-600 dark:hover:bg-violet-700'
                    : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed dark:bg-dark-card dark:border-slate-800 dark:text-slate-600 dark:shadow-none'
                }`}
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Saving Run...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Submit Score</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {/* Right Column: Top 10 Board */}
        <div className="glass p-6 rounded-3xl shadow-sm border border-slate-200/50 dark:border-slate-800/40 md:col-span-7 h-full">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
              <Trophy className="w-5 h-5 text-amber-500" /> Top 10 Scoreboard
            </h3>
            <button 
              onClick={fetchLeaderboard}
              disabled={isLoadingLeaderboard}
              className="p-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-dark-border cursor-pointer transition-all"
              title="Refresh Scoreboard"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoadingLeaderboard ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {isLoadingLeaderboard ? (
            <div className="py-12 text-center text-xs text-slate-400 dark:text-dark-text-muted">
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-violet-500 border-t-transparent mx-auto mb-2"></div>
              <span>Fetching leaderboard...</span>
            </div>
          ) : leaderboardError ? (
            <div className="py-12 text-center text-xs text-rose-500 flex flex-col items-center gap-2">
              <AlertCircle className="w-6 h-6" />
              <span>{leaderboardError}</span>
            </div>
          ) : leaderboard.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-100 dark:border-slate-800/80 text-slate-400 dark:text-dark-text-muted uppercase font-bold text-[9px] tracking-wider">
                    <th className="pb-3 w-12 text-center">Rank</th>
                    <th className="pb-3 pl-2">Player</th>
                    <th className="pb-3 text-right">Score</th>
                    <th className="pb-3 text-right pr-2">Accuracy</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/40">
                  {leaderboard.map((entry, index) => {
                    const isNewEntry = isSubmitted && entry.name === (currentUser?.displayName || 'Player').trim() && entry.score === score;
                    return (
                      <tr 
                        key={entry.id} 
                        className={`transition-colors ${
                          isNewEntry 
                            ? 'bg-violet-50/60 font-bold dark:bg-violet-950/20 animate-pulse' 
                            : 'hover:bg-slate-50/40 dark:hover:bg-dark-border/10'
                        }`}
                      >
                        <td className="py-3 font-semibold text-center">{renderRankBadge(index)}</td>
                        <td className="py-3 pl-2 font-medium text-slate-800 dark:text-slate-200">
                          <div className="truncate max-w-[120px] sm:max-w-[180px]" title={entry.name}>
                            {entry.name}
                          </div>
                          <div className="text-[9px] text-slate-400 flex items-center gap-0.5 mt-0.5">
                            <Clock className="w-2.5 h-2.5 text-slate-400" />
                            <span>{formatCompletedAt(entry.completedAt)}</span>
                          </div>
                        </td>
                        <td className="py-3 text-right font-extrabold text-slate-800 dark:text-slate-200">{entry.score}</td>
                        <td className="py-3 text-right pr-2 font-bold text-violet-600 dark:text-violet-400">{entry.percentage}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-slate-400 dark:text-dark-text-muted leading-relaxed">
              No entries recorded yet. Be the first to register a score!
            </div>
          )}
        </div>
      </section>

      {/* Review Section Toggle */}
      <section className="glass rounded-3xl overflow-hidden shadow-sm border border-slate-200/50 dark:border-slate-800/40">
        <button
          onClick={() => setShowReview(!showReview)}
          className="w-full px-6 py-4 flex items-center justify-between font-bold text-sm text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-dark-border/40 transition-colors duration-200 cursor-pointer"
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-violet-500" /> Review Questions & Answers
          </span>
          {showReview ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </button>

        {showReview && (
          <div className="p-6 divide-y divide-slate-100 dark:divide-slate-800/80 bg-slate-50/30 dark:bg-dark-bg/20">
            {answersHistory.map((item, index) => {
              const isTimedOut = item.selectedAnswer === null;
              
              return (
                <div key={item.questionId} className={`py-5 first:pt-0 last:pb-0`}>
                  <div className="flex items-start gap-3">
                    {item.isCorrect ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-grow">
                      <span className="text-[10px] font-bold text-slate-400 dark:text-dark-text-muted block uppercase tracking-wider mb-1">
                        Question {index + 1}
                      </span>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-snug mb-3">
                        {item.questionText}
                      </h4>
                      
                      {/* Selected vs Correct Comparison block */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-4">
                        <div className={`p-3 rounded-xl border ${
                          item.isCorrect 
                            ? 'bg-emerald-50/50 border-emerald-100 text-emerald-800 dark:bg-emerald-950/10 dark:border-emerald-900/30 dark:text-emerald-400' 
                            : isTimedOut
                              ? 'bg-rose-50/50 border-rose-100 text-rose-800 dark:bg-rose-950/10 dark:border-rose-900/30 dark:text-rose-400'
                              : 'bg-rose-50/50 border-rose-100 text-rose-800 dark:bg-rose-950/10 dark:border-rose-900/30 dark:text-rose-400'
                        }`}>
                          <span className="text-[9px] uppercase tracking-wider font-bold block opacity-60 mb-0.5">
                            Your Choice
                          </span>
                          <span className="font-semibold">{isTimedOut ? "Time Out (No Selection)" : item.selectedAnswer}</span>
                        </div>
                        
                        {!item.isCorrect && (
                          <div className="p-3 bg-emerald-50/50 border border-emerald-100 text-emerald-800 dark:bg-emerald-950/10 dark:border-emerald-900/30 dark:text-emerald-400 rounded-xl">
                            <span className="text-[9px] uppercase tracking-wider font-bold block opacity-60 mb-0.5">
                              Correct Choice
                            </span>
                            <span className="font-semibold">{item.correctAnswer}</span>
                          </div>
                        )}
                      </div>

                      {/* Explanation box */}
                      <div className="bg-slate-100/80 dark:bg-dark-border/40 rounded-xl p-3.5 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border border-slate-200/50 dark:border-slate-800/40">
                        <strong className="text-[9px] uppercase tracking-wider font-bold block text-slate-400 dark:text-dark-text-muted mb-1">
                          Explanation
                        </strong>
                        {item.explanation}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </motion.div>
  );
}
