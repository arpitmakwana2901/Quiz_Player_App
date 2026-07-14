import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { HelpCircle, Clock, ArrowRight, Heart } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';

const categoryGradients = {
  'General Knowledge': 'from-blue-500 to-indigo-600',
  'Programming': 'from-emerald-500 to-teal-600',
  'Entertainment': 'from-rose-500 to-pink-600',
  'Science': 'from-purple-500 to-violet-600',
  'Sports': 'from-amber-500 to-orange-600',
  'JavaScript': 'from-yellow-500 to-amber-600 dark:from-yellow-600 dark:to-amber-700',
  'HTML': 'from-orange-500 to-red-600 dark:from-orange-600 dark:to-red-700',
  'CSS': 'from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700',
  'React': 'from-cyan-500 to-sky-600 dark:from-cyan-600 dark:to-sky-700',
  'Node.js': 'from-emerald-500 to-green-600 dark:from-emerald-600 dark:to-green-700'
};

const difficultyColors = {
  'Easy': {
    bg: 'bg-emerald-50 dark:bg-emerald-950/20',
    text: 'text-emerald-700 dark:text-emerald-400',
    border: 'border-emerald-200/60 dark:border-emerald-800/30'
  },
  'Medium': {
    bg: 'bg-amber-50 dark:bg-amber-950/20',
    text: 'text-amber-700 dark:text-amber-400',
    border: 'border-amber-200/60 dark:border-amber-800/30'
  },
  'Hard': {
    bg: 'bg-rose-50 dark:bg-rose-950/20',
    text: 'text-rose-700 dark:text-rose-400',
    border: 'border-rose-200/60 dark:border-rose-800/30'
  }
};

export default function QuizCard({ quiz }) {
  const { id, title, description, category, difficulty, timeLimit, totalQuestions } = quiz;
  const { currentUser, favorites, toggleFavorite } = useAuth();
  
  const gradient = categoryGradients[category] || 'from-violet-500 to-indigo-600';
  const diffStyle = difficultyColors[difficulty] || difficultyColors['Easy'];
  const isFavorited = favorites.includes(id);

  const handleFavoriteToggle = async (e) => {
    e.preventDefault();
    e.stopPropagation();

    if (!currentUser) {
      toast.info("Please log in to add quizzes to your favorites!");
      return;
    }

    try {
      await toggleFavorite(id);
      if (isFavorited) {
        toast.success(`Removed "${title}" from favorites.`);
      } else {
        toast.success(`Added "${title}" to favorites!`);
      }
    } catch (error) {
      toast.error("Failed to update favorites. Please check your network.");
    }
  };

  return (
    <motion.div
      className="glass-card flex flex-col justify-between h-full rounded-3xl overflow-hidden group hover:shadow-xl dark:hover:shadow-violet-950/10 transition-all duration-300"
      whileHover={{ y: -6, scale: 1.01 }}
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Card Header Background Gradient */}
      <div className={`h-24 bg-gradient-to-br ${gradient} p-5 flex items-end justify-between relative overflow-hidden`}>
        {/* Subtle decorative background shapes */}
        <div className="absolute top-[-20%] right-[-10%] w-24 h-24 rounded-full bg-white/10 blur-md group-hover:scale-125 transition-transform duration-500" />
        <div className="absolute bottom-[-30%] left-[-5%] w-16 h-16 rounded-full bg-white/5 blur-sm" />
        
        <span className="text-[10px] font-bold uppercase tracking-widest text-white/95 bg-white/15 backdrop-blur-sm border border-white/10 px-2.5 py-1 rounded-full relative z-10">
          {category}
        </span>

        {/* Favorite Heart Button */}
        <button
          onClick={handleFavoriteToggle}
          className="p-2 rounded-xl bg-white/15 backdrop-blur-sm border border-white/10 text-white hover:bg-white/20 active:scale-90 transition-all cursor-pointer relative z-10"
          aria-label={isFavorited ? "Remove from Favorites" : "Add to Favorites"}
        >
          <Heart 
            className={`w-4 h-4 transition-colors duration-200 ${
              isFavorited ? 'text-red-500 fill-red-500' : 'text-white'
            }`} 
          />
        </button>
      </div>

      {/* Card Body */}
      <div className="p-5 flex-grow flex flex-col justify-between">
        <div>
          {/* Difficulty badge */}
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${diffStyle.bg} ${diffStyle.text} ${diffStyle.border}`}>
              {difficulty}
            </span>
          </div>
          <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100 line-clamp-1 group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors duration-200">
            {title}
          </h3>
          <p className="text-xs text-slate-500 dark:text-dark-text-muted mt-2 line-clamp-2 leading-relaxed">
            {description}
          </p>
        </div>

        {/* Quiz Metadata */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800/80 grid grid-cols-2 gap-3 text-slate-600 dark:text-slate-400">
          <div className="flex items-center gap-1.5 text-[11px] font-medium">
            <HelpCircle className="w-3.5 h-3.5 text-violet-500" />
            <span>{totalQuestions} Questions</span>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-medium">
            <Clock className="w-3.5 h-3.5 text-fuchsia-500" />
            <span>{timeLimit}s / Q</span>
          </div>
        </div>
      </div>

      {/* Action footer */}
      <div className="px-5 pb-5 pt-1">
        <Link 
          to={`/quiz/${id}`}
          className="w-full inline-flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl bg-slate-900 text-white font-semibold text-xs tracking-wide hover:bg-violet-600 shadow-md hover:shadow-violet-500/20 active:scale-95 transition-all dark:bg-violet-600 dark:hover:bg-violet-700 cursor-pointer"
        >
          <span>Play Quiz</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </motion.div>
  );
}
