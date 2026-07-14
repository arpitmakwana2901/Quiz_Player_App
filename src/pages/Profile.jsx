import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { fetchQuizzes } from "../firebase/quizzes";
import QuizCard from "../components/QuizCard";
import {
  User,
  Mail,
  Calendar,
  Trophy,
  BarChart2,
  Star,
  Clock,
  ArrowRight,
  Edit3,
  Check,
  X,
  Loader2,
  Award,
  Heart,
  HelpCircle,
} from "lucide-react";
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  doc,
  updateDoc,
} from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { auth, db } from "../firebase/config";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

export default function Profile() {
  const { currentUser, userData, favorites } = useAuth();

  // States
  const [quizzes, setQuizzes] = useState([]);
  const [stats, setStats] = useState({
    totalPlayed: 0,
    highestScore: 0,
    averageScore: 0,
    bestRank: "N/A",
  });
  const [recentAttempts, setRecentAttempts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Edit profile states
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(
    userData?.fullName || currentUser?.displayName || "",
  );
  const [isSaving, setIsSaving] = useState(false);

  // Fetch all quizzes and stats
  useEffect(() => {
    let active = true;

    const loadProfileData = async () => {
      if (!currentUser) return;
      setLoading(true);
      try {
        // 1. Fetch quizzes (to render favorites)
        const quizList = await fetchQuizzes();
        if (active) setQuizzes(quizList);

        // 2. Fetch history attempts from Firestore users/{uid}/history
        const historyColRef = collection(
          db,
          "users",
          currentUser.uid,
          "history",
        );
        const historyQuery = query(
          historyColRef,
          orderBy("completedAt", "desc"),
        );
        const historySnap = await getDocs(historyQuery);

        const attempts = [];
        let totalScore = 0;
        let maxScore = 0;

        historySnap.forEach((doc) => {
          const data = doc.data();
          let completedDate = new Date();
          if (data.completedAt) {
            completedDate =
              typeof data.completedAt.toDate === "function"
                ? data.completedAt.toDate()
                : new Date(data.completedAt);
          }
          attempts.push({
            id: doc.id,
            ...data,
            completedAt: completedDate,
          });
          totalScore += data.score || 0;
          if (data.score > maxScore) {
            maxScore = data.score;
          }
        });

        // 3. Find the user's best rank in the global leaderboard
        let topRankVal = "N/A";
        const leaderboardSnap = await getDocs(collection(db, "leaderboard"));
        const nameToMatch = (
          userData?.fullName ||
          currentUser.displayName ||
          ""
        ).trim();

        if (nameToMatch) {
          // Group leaderboard entries by quiz and sort to find user's highest rank placement
          const leaderboardByQuiz = {};
          leaderboardSnap.forEach((doc) => {
            const data = doc.data();
            if (!leaderboardByQuiz[data.quizId]) {
              leaderboardByQuiz[data.quizId] = [];
            }
            leaderboardByQuiz[data.quizId].push(data);
          });

          let bestRankNum = Infinity;
          Object.keys(leaderboardByQuiz).forEach((quizId) => {
            // Sort entries for this quiz: highest score first
            const sorted = leaderboardByQuiz[quizId].sort(
              (a, b) => b.score - a.score,
            );
            const userIndex = sorted.findIndex(
              (entry) => entry.name.toLowerCase() === nameToMatch.toLowerCase(),
            );
            if (userIndex !== -1 && userIndex + 1 < bestRankNum) {
              bestRankNum = userIndex + 1;
            }
          });

          if (bestRankNum !== Infinity) {
            topRankVal = `#${bestRankNum}`;
          }
        }

        if (active) {
          setRecentAttempts(attempts.slice(0, 3)); // Store top 3 latest
          setStats({
            totalPlayed: attempts.length,
            highestScore: maxScore,
            averageScore:
              attempts.length > 0
                ? Math.round(totalScore / attempts.length)
                : 0,
            bestRank: topRankVal,
          });
        }
      } catch (err) {
        console.error("Failed to load profile parameters:", err);
      } finally {
        if (active) setLoading(false);
      }
    };

    loadProfileData();
    return () => {
      active = false;
    };
  }, [currentUser, userData]);

  // Handle Edit Name Save Action
  const handleSaveName = async () => {
    if (!newName.trim() || newName.trim().length < 2) {
      toast.error("Name must be at least 2 characters long.");
      return;
    }

    setIsSaving(true);
    try {
      // 1. Update Firebase Auth Profile
      await updateProfile(auth.currentUser, {
        displayName: newName.trim(),
      });

      // 2. Update Firestore User Document
      await updateDoc(doc(db, "users", currentUser.uid), {
        fullName: newName.trim(),
      });

      toast.success("Profile name updated successfully!");
      setIsEditing(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to save profile changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  // Filter quizzes that are favorited by user
  const favoriteQuizzes = quizzes.filter((q) => favorites.includes(q.id));

  // Format joined date
  const formatJoinedDate = () => {
    if (userData?.createdAt) {
      const date =
        typeof userData.createdAt.toDate === "function"
          ? userData.createdAt.toDate()
          : new Date(userData.createdAt);
      return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });
    }
    return "Recently";
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />
        <span className="text-sm font-semibold text-slate-500 dark:text-dark-text-muted">
          Loading player profile...
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col gap-8 sm:gap-10">
      {/* Profile Card & Bio Details */}
      <section className="glass rounded-3xl overflow-hidden shadow-lg border border-slate-200/50 dark:border-slate-800/40 grid grid-cols-1 md:grid-cols-12">
        <div className="md:col-span-4 bg-gradient-to-br from-violet-600 to-indigo-800 p-8 sm:p-10 text-white flex flex-col items-center justify-center text-center relative overflow-hidden">
          <div className="absolute top-[-20%] left-[-20%] w-48 h-48 rounded-full bg-white/10 blur-xl" />

          {/* Avatar circle */}
          <div className="w-20 h-20 rounded-full bg-white/20 border border-white/30 backdrop-blur-md flex items-center justify-center text-3xl font-black mb-4 relative z-10 uppercase shadow-inner">
            {userData?.fullName
              ? userData.fullName.charAt(0)
              : currentUser?.displayName
                ? currentUser.displayName.charAt(0)
                : "P"}
          </div>

          {/* Name Editor panel */}
          {isEditing ? (
            <div className="w-full space-y-3 relative z-10">
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                disabled={isSaving}
                className="w-full text-center px-3 py-1.5 rounded-xl border border-white/20 bg-white/10 text-sm font-bold text-white focus:outline-none focus:ring-2 focus:ring-white/40"
                required
              />
              <div className="flex gap-2 justify-center">
                <button
                  onClick={handleSaveName}
                  disabled={isSaving}
                  className="p-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white cursor-pointer active:scale-95 shadow-sm"
                  title="Save changes"
                >
                  {isSaving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  onClick={() => {
                    setIsEditing(false);
                    setNewName(userData?.fullName || "");
                  }}
                  disabled={isSaving}
                  className="p-1.5 rounded-lg bg-rose-500 hover:bg-rose-600 text-white cursor-pointer active:scale-95 shadow-sm"
                  title="Cancel"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <div className="relative z-10 w-full">
              <h2 className="text-xl sm:text-2xl font-black flex items-center justify-center gap-1.5">
                {userData?.fullName || currentUser?.displayName || "Player"}
                <button
                  onClick={() => setIsEditing(true)}
                  className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Edit Profile Name"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                </button>
              </h2>
              <p className="text-xs text-white/80 mt-1">{currentUser?.email}</p>
            </div>
          )}

          <div className="mt-6 flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-white/60 relative z-10">
            <Calendar className="w-3.5 h-3.5" />
            <span>Joined {formatJoinedDate()}</span>
          </div>
        </div>

        {/* Right side stats blocks */}
        <div className="md:col-span-8 p-6 sm:p-10 bg-white/40 dark:bg-dark-card/30 grid grid-cols-2 lg:grid-cols-4 gap-6 divide-y divide-x divide-slate-100 dark:divide-slate-800/80">
          <div className="flex flex-col items-center justify-center text-center p-3">
            <BarChart2 className="w-6 h-6 text-violet-500 mb-2" />
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-dark-text-muted block">
              Quizzes Played
            </span>
            <span className="text-2xl font-black text-slate-800 dark:text-slate-200 mt-1">
              {stats.totalPlayed}
            </span>
          </div>
          <div className="flex flex-col items-center justify-center text-center p-3">
            <Trophy className="w-6 h-6 text-amber-500 mb-2" />
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-dark-text-muted block">
              Highest Score
            </span>
            <span className="text-2xl font-black text-slate-800 dark:text-slate-200 mt-1">
              {stats.highestScore} Pts
            </span>
          </div>
          <div className="flex flex-col items-center justify-center text-center p-3">
            <Award className="w-6 h-6 text-emerald-500 mb-2" />
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-dark-text-muted block">
              Best Rank
            </span>
            <span className="text-2xl font-black text-slate-800 dark:text-slate-200 mt-1">
              {stats.bestRank}
            </span>
          </div>
          <div className="flex flex-col items-center justify-center text-center p-3">
            <Star className="w-6 h-6 text-fuchsia-500 mb-2" />
            <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-dark-text-muted block">
              Favorites count
            </span>
            <span className="text-2xl font-black text-slate-800 dark:text-slate-200 mt-1">
              {favorites.length}
            </span>
          </div>
        </div>
      </section>

      {/* Profile Inner Grid panels */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Side: Recently Played Quizzes (Latest 5) & Recent Attempts logs */}
        <div className="lg:col-span-8 space-y-8">
          {/* Recently Played Quizzes Section */}
          <div className="glass p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/50 dark:border-slate-800/40">
            <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-1.5">
              <Clock className="w-5 h-5 text-violet-500" /> Recently Played
            </h3>

            {userData?.recentlyPlayed && userData.recentlyPlayed.length > 0 ? (
              <div className="space-y-4">
                {userData.recentlyPlayed.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 bg-white/50 border border-slate-100 dark:bg-dark-bg/25 dark:border-slate-800 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-0 hover:border-violet-200 dark:hover:border-violet-900/30 transition-colors"
                  >
                    <div>
                      <span className="inline-block text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-violet-100 text-violet-700 dark:bg-violet-950/20 dark:text-violet-400 border border-violet-200/20 mb-1.5">
                        {item.category}
                      </span>
                      <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200 leading-snug">
                        {item.title}
                      </h4>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Played on {new Date(item.playedAt).toLocaleDateString()}{" "}
                        at{" "}
                        {new Date(item.playedAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>

                    <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                      <div className="text-right sm:pr-4">
                        <span className="text-[9px] uppercase tracking-wider font-extrabold text-slate-400 dark:text-dark-text-muted block">
                          Accuracy
                        </span>
                        <span className="text-sm font-black text-violet-600 dark:text-violet-400">
                          {item.percentage}% ({item.score} Pts)
                        </span>
                      </div>
                      <Link
                        to={`/quiz/${item.quizId}`}
                        className="inline-flex items-center gap-1 py-2 px-4 rounded-xl bg-slate-900 text-white font-bold text-[10px] uppercase hover:bg-violet-600 dark:bg-violet-600 dark:hover:bg-violet-700 transition-colors active:scale-95 cursor-pointer shadow-sm"
                      >
                        <span>Replay</span>
                        <ArrowRight className="w-3 h-3" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-slate-400 dark:text-dark-text-muted">
                No quizzes played recently. Go to Home to launch a challenge!
              </div>
            )}
          </div>

          {/* Recent attempts Table Log (Last 3) */}
          <div className="glass p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/50 dark:border-slate-800/40">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-violet-500" /> Recent
                Attempts Log
              </h3>
              {stats.totalPlayed > 3 && (
                <Link
                  to="/history"
                  className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline inline-flex items-center gap-0.5"
                >
                  <span>See All ({stats.totalPlayed})</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              )}
            </div>

            {recentAttempts.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 dark:border-slate-800/80 text-slate-400 dark:text-dark-text-muted uppercase font-bold text-[9px] tracking-wider">
                      <th className="pb-3 w-12 text-center">Run</th>
                      <th className="pb-3 pl-2">Quiz</th>
                      <th className="pb-3 text-right">Score</th>
                      <th className="pb-3 text-right">Time Taken</th>
                      <th className="pb-3 text-right pr-2">Accuracy</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100/50 dark:divide-slate-800/40">
                    {recentAttempts.map((attempt) => (
                      <tr
                        key={attempt.id}
                        className="hover:bg-slate-50/40 dark:hover:bg-dark-border/10"
                      >
                        <td className="py-3 font-bold text-center text-slate-400 dark:text-dark-text-muted">
                          #{attempt.attemptNumber}
                        </td>
                        <td className="py-3 pl-2 font-semibold text-slate-800 dark:text-slate-200">
                          <div
                            className="truncate max-w-[120px] sm:max-w-[200px]"
                            title={attempt.quizTitle}
                          >
                            {attempt.quizTitle}
                          </div>
                          <div className="text-[9px] text-slate-400 mt-0.5">
                            {attempt.completedAt.toLocaleDateString()}
                          </div>
                        </td>
                        <td className="py-3 text-right font-extrabold text-slate-800 dark:text-slate-200">
                          {attempt.score} Pts
                        </td>
                        <td className="py-3 text-right text-slate-500 dark:text-dark-text-muted font-medium">
                          {attempt.timeTaken}s
                        </td>
                        <td className="py-3 text-right pr-2 font-black text-violet-600 dark:text-violet-400">
                          {attempt.percentage}%
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8 text-xs text-slate-400 dark:text-dark-text-muted">
                No attempt records logged yet.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Favorite Quizzes (Hearts List) */}
        <div className="lg:col-span-4 glass p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-200/50 dark:border-slate-800/40">
          <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-1.5">
            <Heart className="w-5 h-5 text-red-500 fill-red-500" /> Favorites (
            {favorites.length})
          </h3>

          {favoriteQuizzes.length > 0 ? (
            <div className="grid grid-cols-1 gap-5">
              {favoriteQuizzes.map((quiz) => (
                <div
                  key={quiz.id}
                  className="h-full scale-95 hover:scale-98 transition-transform"
                >
                  <QuizCard quiz={quiz} />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-2xl flex flex-col items-center justify-center p-4">
              <Heart className="w-8 h-8 text-slate-300 dark:text-slate-800 mb-2" />
              <h4 className="text-xs font-bold text-slate-500 dark:text-dark-text-muted">
                No Favorites Added
              </h4>
              <p className="text-[10px] text-slate-400 mt-1 max-w-xs leading-relaxed">
                Click the heart icon on any quiz card on the Home dashboard to
                pin them here!
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
