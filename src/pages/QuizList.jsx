import React, { useState, useEffect, useMemo } from 'react';
import { fetchQuizzes } from '../firebase/quizzes';
import QuizCard from '../components/QuizCard';
import { Search, Filter, RefreshCw, X, Award, HelpCircle, Loader2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function QuizList() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('All');
  const [difficultyFilter, setDifficultyFilter] = useState('All');

  // Fetch quizzes from Firestore
  const loadQuizzes = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchQuizzes();
      setQuizzes(data);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch quizzes from the database. Please check your connection or Firestore setup.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadQuizzes();
  }, []);

  // Extract unique categories dynamically from quizzes
  const categories = useMemo(() => {
    const allCats = quizzes.map((q) => q.category);
    return ['All', ...new Set(allCats)];
  }, [quizzes]);

  // Filter quizzes based on query and selected category/difficulty
  const filteredQuizzes = useMemo(() => {
    return quizzes.filter((quiz) => {
      const matchesSearch = 
        quiz.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        quiz.description.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = categoryFilter === 'All' || quiz.category === categoryFilter;
      const matchesDifficulty = difficultyFilter === 'All' || quiz.difficulty === difficultyFilter;

      return matchesSearch && matchesCategory && matchesDifficulty;
    });
  }, [quizzes, searchQuery, categoryFilter, difficultyFilter]);

  // Reset all filters
  const resetFilters = () => {
    setSearchQuery('');
    setCategoryFilter('All');
    setDifficultyFilter('All');
  };

  // Stagger animation container
  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />
        <span className="text-sm font-semibold text-slate-500 dark:text-dark-text-muted">
          Loading challenges...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center mx-auto mb-5 text-rose-600 dark:text-rose-400">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">Fetch Error</h2>
        <p className="text-xs text-slate-500 dark:text-dark-text-muted mb-6 leading-relaxed">
          {error}
        </p>
        <button 
          onClick={loadQuizzes}
          className="inline-flex items-center gap-1.5 py-2.5 px-6 rounded-xl bg-slate-900 text-white font-semibold text-xs tracking-wide hover:bg-violet-600 active:scale-95 transition-all dark:bg-violet-600 dark:hover:bg-violet-700 cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Retry Loading</span>
        </button>
      </div>
    );
  }

  return (
    <motion.div 
      className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {/* Dynamic Welcome Hero Banner */}
      <section className="relative rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-800 text-white p-6 sm:p-10 mb-8 sm:mb-12 shadow-xl overflow-hidden">
        {/* Animated decorative shapes */}
        <div className="absolute top-[-30%] right-[-10%] w-72 h-72 rounded-full bg-white/10 blur-xl animate-pulse" />
        <div className="absolute bottom-[-10%] left-[20%] w-48 h-48 rounded-full bg-fuchsia-500/20 blur-lg" />
        
        <div className="relative z-10 max-w-2xl">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-white/15 border border-white/10 tracking-wide uppercase mb-4">
            <Award className="w-3.5 h-3.5 text-amber-300" /> Live Leaderboard Active
          </span>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-none mb-3 sm:mb-4">
            Test Your Knowledge,<br />Claim the Top Spot.
          </h1>
          <p className="text-sm sm:text-base text-white/80 font-medium max-w-lg mb-6 leading-relaxed">
            Pick a topic below to challenge yourself. Finish in time with maximum accuracy to secure your rank on the scoreboard!
          </p>
          <div className="flex gap-4 text-xs font-semibold text-white/90">
            <div className="flex items-center gap-1.5 bg-black/15 px-3 py-1.5 rounded-xl border border-white/5">
              <HelpCircle className="w-4 h-4 text-violet-300" />
              <span>{quizzes.length} Curated Quizzes</span>
            </div>
          </div>
        </div>
      </section>

      {/* Search and Filters Panel */}
      <section className="glass p-5 rounded-3xl mb-8 sm:mb-10 flex flex-col md:flex-row gap-4 items-center justify-between shadow-sm">
        {/* Search Input */}
        <div className="relative w-full md:max-w-xs">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search quizzes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200/80 bg-white/50 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-500 transition-all dark:border-slate-800 dark:bg-dark-bg/40 dark:text-slate-100"
          />
          {searchQuery && (
            <button 
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Filter Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Category Filter */}
          <div className="flex items-center gap-1.5 w-full sm:w-auto">
            <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full sm:w-auto px-3.5 py-2.5 rounded-2xl border border-slate-200/80 bg-white text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/25 dark:border-slate-800 dark:bg-dark-card dark:text-slate-300"
            >
              <option value="All">All Categories</option>
              {categories.slice(1).map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Difficulty Filter */}
          <select
            value={difficultyFilter}
            onChange={(e) => setDifficultyFilter(e.target.value)}
            className="w-full sm:w-auto px-3.5 py-2.5 rounded-2xl border border-slate-200/80 bg-white text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/25 dark:border-slate-800 dark:bg-dark-card dark:text-slate-300"
          >
            <option value="All">All Difficulties</option>
            <option value="Easy">Easy</option>
            <option value="Medium">Medium</option>
            <option value="Hard">Hard</option>
          </select>

          {/* Reset Filters Option */}
          {(searchQuery || categoryFilter !== 'All' || difficultyFilter !== 'All') && (
            <button
              onClick={resetFilters}
              className="flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl border border-dashed border-violet-300 dark:border-violet-800/80 text-xs font-bold text-violet-600 dark:text-violet-400 hover:bg-violet-50 dark:hover:bg-violet-950/20 active:scale-95 transition-all w-full sm:w-auto cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Reset Filters</span>
            </button>
          )}
        </div>
      </section>

      {/* Quizzes Grid Listing */}
      {filteredQuizzes.length > 0 ? (
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
          variants={containerVariants}
          initial="hidden"
          animate="show"
        >
          {filteredQuizzes.map((quiz) => (
            <div key={quiz.id} className="h-full">
              <QuizCard quiz={quiz} />
            </div>
          ))}
        </motion.div>
      ) : (
        /* Empty State */
        <motion.div 
          className="glass p-10 sm:p-16 rounded-3xl text-center max-w-md mx-auto shadow-md"
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
        >
          <div className="w-16 h-16 rounded-full bg-violet-50 dark:bg-violet-950/20 flex items-center justify-center mx-auto mb-5 text-violet-600 dark:text-violet-400">
            <Search className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 dark:text-slate-100 mb-2">No Quizzes Found</h3>
          <p className="text-xs text-slate-500 dark:text-dark-text-muted mb-6 max-w-xs mx-auto leading-relaxed">
            We couldn't find any quizzes matching your current search or filter combination. Try resetting your choices!
          </p>
          <button
            onClick={resetFilters}
            className="inline-flex items-center gap-1.5 py-2.5 px-6 rounded-xl bg-slate-900 text-white font-semibold text-xs tracking-wide hover:bg-violet-600 active:scale-95 shadow-md transition-all dark:bg-violet-600 dark:hover:bg-violet-700 cursor-pointer"
          >
            <span>Show All Quizzes</span>
          </button>
        </motion.div>
      )}
    </motion.div>
  );
}
