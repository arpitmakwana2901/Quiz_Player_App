import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { fetchQuizzes } from '../firebase/quizzes';
import { db } from '../firebase/config';
import { 
  collection, doc, addDoc, setDoc, deleteDoc, getDocs, updateDoc, serverTimestamp 
} from 'firebase/firestore';
import { 
  Trophy, BookOpen, User, Plus, Trash2, Edit3, Loader2, 
  HelpCircle, Settings, X, Save, AlertTriangle, ArrowLeft
} from 'lucide-react';
import { toast } from 'react-toastify';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';

const CATEGORIES = ['JavaScript', 'HTML', 'CSS', 'React', 'Node.js'];
const DIFFICULTIES = ['Easy', 'Medium', 'Hard'];

export default function AdminPanel() {
  const { userData } = useAuth();
  
  // States
  const [quizzes, setQuizzes] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [dashboardStats, setDashboardStats] = useState({
    totalQuizzes: 0,
    totalUsers: 0,
    totalAttempts: 0
  });

  // Modal States
  const [isQuizModalOpen, setIsQuizModalOpen] = useState(false);
  const [editingQuiz, setEditingQuiz] = useState(null); // null for Add, quiz object for Edit
  const [isDeletingId, setIsDeletingId] = useState(null); // id of quiz to delete
  const [isSaving, setIsSaving] = useState(false);

  // Form Fields
  const [formTitle, setFormTitle] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formCategory, setFormCategory] = useState(CATEGORIES[0]);
  const [formDifficulty, setFormDifficulty] = useState(DIFFICULTIES[0]);
  const [formTimeLimit, setFormTimeLimit] = useState(30);
  const [formQuestions, setFormQuestions] = useState([
    { id: 'q1', question: '', options: ['', '', '', ''], correctAnswer: '', explanation: '', points: 10 }
  ]);

  // Load Dashboard Data
  const loadDashboard = async () => {
    setIsLoadingData(true);
    try {
      // 1. Fetch quizzes
      const quizList = await fetchQuizzes();
      setQuizzes(quizList);

      // 2. Fetch users count
      const usersSnap = await getDocs(collection(db, 'users'));
      
      // 3. Fetch runs/leaderboard count
      const runsSnap = await getDocs(collection(db, 'leaderboard'));

      setDashboardStats({
        totalQuizzes: quizList.length,
        totalUsers: usersSnap.size,
        totalAttempts: runsSnap.size
      });
    } catch (error) {
      console.error("Failed to load admin dashboard indices:", error);
      toast.error("Failed to fetch dashboard statistics.");
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    loadDashboard();
  }, []);

  // Pre-fill form when editing a quiz
  const handleOpenEdit = (quiz) => {
    setEditingQuiz(quiz);
    setFormTitle(quiz.title);
    setFormDescription(quiz.description);
    setFormCategory(quiz.category);
    setFormDifficulty(quiz.difficulty);
    setFormTimeLimit(quiz.timeLimit);
    setFormQuestions(quiz.questions.map((q, idx) => ({
      id: q.id || `q${idx + 1}`,
      question: q.question,
      options: [...q.options],
      correctAnswer: q.correctAnswer,
      explanation: q.explanation || '',
      points: q.points || 10
    })));
    setIsQuizModalOpen(true);
  };

  // Open clean form for adding a quiz
  const handleOpenAdd = () => {
    setEditingQuiz(null);
    setFormTitle('');
    setFormDescription('');
    setFormCategory(CATEGORIES[0]);
    setFormDifficulty(DIFFICULTIES[0]);
    setFormTimeLimit(30);
    setFormQuestions([
      { id: 'q1', question: '', options: ['', '', '', ''], correctAnswer: '', explanation: '', points: 10 }
    ]);
    setIsQuizModalOpen(true);
  };

  // Add Question Input Card to Form
  const handleAddQuestionField = () => {
    const nextIndex = formQuestions.length + 1;
    setFormQuestions([
      ...formQuestions,
      { id: `q${nextIndex}`, question: '', options: ['', '', '', ''], correctAnswer: '', explanation: '', points: 10 }
    ]);
  };

  // Remove Question Field
  const handleRemoveQuestionField = (index) => {
    if (formQuestions.length === 1) {
      toast.warning("A quiz must have at least one question.");
      return;
    }
    const updated = formQuestions.filter((_, idx) => idx !== index);
    setFormQuestions(updated);
  };

  // Update a field inside a question
  const handleUpdateQuestion = (index, field, value) => {
    const updated = [...formQuestions];
    updated[index][field] = value;
    setFormQuestions(updated);
  };

  // Update options inside a question
  const handleUpdateOption = (qIdx, optIdx, val) => {
    const updated = [...formQuestions];
    updated[qIdx].options[optIdx] = val;
    setFormQuestions(updated);
  };

  // Save Quiz Form Action (Insert/Update)
  const handleSaveQuiz = async (e) => {
    e.preventDefault();

    // 1. Validations
    if (!formTitle.trim()) {
      toast.error("Quiz Title is required.");
      return;
    }
    if (!formDescription.trim()) {
      toast.error("Quiz Description is required.");
      return;
    }
    
    // Check questions
    for (let i = 0; i < formQuestions.length; i++) {
      const q = formQuestions[i];
      if (!q.question.trim()) {
        toast.error(`Question ${i + 1} text is empty.`);
        return;
      }
      for (let j = 0; j < 4; j++) {
        if (!q.options[j].trim()) {
          toast.error(`Question ${i + 1} option ${j + 1} is empty.`);
          return;
        }
      }
      if (!q.correctAnswer.trim()) {
        toast.error(`Question ${i + 1} correct answer is required.`);
        return;
      }
      if (!q.options.includes(q.correctAnswer.trim())) {
        toast.error(`Question ${i + 1} correct answer must match one of the four options exactly.`);
        return;
      }
    }

    setIsSaving(true);
    try {
      const quizPayload = {
        title: formTitle.trim(),
        description: formDescription.trim(),
        category: formCategory,
        difficulty: formDifficulty,
        timeLimit: Number(formTimeLimit),
        totalQuestions: formQuestions.length,
        questions: formQuestions.map(q => ({
          id: q.id,
          question: q.question.trim(),
          options: q.options.map(o => o.trim()),
          correctAnswer: q.correctAnswer.trim(),
          explanation: q.explanation.trim(),
          points: Number(q.points)
        }))
      };

      if (editingQuiz) {
        // Update existing quiz
        await setDoc(doc(db, 'quizzes', editingQuiz.id), quizPayload);
        toast.success(`Quiz "${formTitle}" updated successfully!`);
      } else {
        // Create new quiz - auto-generate doc ID (e.g. quiz_html_basics)
        const cleanId = formTitle.toLowerCase().replace(/[^a-z0-9]+/g, '_');
        await setDoc(doc(db, 'quizzes', `quiz_${cleanId}`), quizPayload);
        toast.success(`Quiz "${formTitle}" added successfully!`);
      }

      setIsQuizModalOpen(false);
      loadDashboard();
    } catch (error) {
      console.error("Failed to write quiz:", error);
      toast.error("Failed to save quiz details. Check database writes.");
    } finally {
      setIsSaving(false);
    }
  };

  // Delete Quiz action
  const handleDeleteQuiz = async () => {
    if (!isDeletingId) return;
    try {
      await deleteDoc(doc(db, 'quizzes', isDeletingId));
      toast.success("Quiz deleted successfully!");
      setIsDeletingId(null);
      loadDashboard();
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete quiz.");
    }
  };

  if (isLoadingData) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />
        <span className="text-sm font-semibold text-slate-500 dark:text-dark-text-muted">
          Loading administration console...
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-10 flex flex-col gap-8">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <Link 
            to="/profile" 
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-dark-text-muted dark:hover:text-slate-200 mb-2 group cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            <span>Back to Profile</span>
          </Link>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <Settings className="w-7 h-7 text-violet-500" /> Admin Console
          </h1>
          <p className="text-xs text-slate-500 dark:text-dark-text-muted mt-1 font-semibold">
            Manage quizzes, categories, and review global platform analytics.
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-1.5 py-2.5 px-5 rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white font-bold text-xs uppercase tracking-wide shadow-md hover:shadow-violet-500/20 active:scale-95 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Quiz</span>
        </button>
      </div>

      {/* Analytics widgets row */}
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="glass p-5 rounded-3xl flex items-center gap-4 shadow-sm border border-slate-200/50 dark:border-slate-800/40">
          <div className="p-3.5 rounded-2xl bg-violet-100 text-violet-600 dark:bg-violet-950/20 dark:text-violet-400">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-dark-text-muted block">
              Total Quizzes
            </span>
            <span className="text-xl font-black text-slate-800 dark:text-slate-200">{dashboardStats.totalQuizzes}</span>
          </div>
        </div>
        <div className="glass p-5 rounded-3xl flex items-center gap-4 shadow-sm border border-slate-200/50 dark:border-slate-800/40">
          <div className="p-3.5 rounded-2xl bg-emerald-100 text-emerald-600 dark:bg-emerald-950/20 dark:text-emerald-400">
            <User className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-dark-text-muted block">
              Total Registered Users
            </span>
            <span className="text-xl font-black text-slate-800 dark:text-slate-200">{dashboardStats.totalUsers}</span>
          </div>
        </div>
        <div className="glass p-5 rounded-3xl flex items-center gap-4 shadow-sm border border-slate-200/50 dark:border-slate-800/40">
          <div className="p-3.5 rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950/20 dark:text-amber-400">
            <Trophy className="w-6 h-6" />
          </div>
          <div>
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-400 dark:text-dark-text-muted block">
              Global Attempts Count
            </span>
            <span className="text-xl font-black text-slate-800 dark:text-slate-200">{dashboardStats.totalAttempts} runs</span>
          </div>
        </div>
      </section>

      {/* Quizzes Listing Table */}
      <section className="glass rounded-3xl overflow-hidden shadow-sm border border-slate-200/50 dark:border-slate-800/40">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800/80 text-slate-400 dark:text-dark-text-muted uppercase font-bold text-[9px] tracking-wider bg-slate-50/50 dark:bg-dark-card/25">
                <th className="py-4 pl-6">Quiz Title</th>
                <th className="py-4">Category</th>
                <th className="py-4">Difficulty</th>
                <th className="py-4 text-center">Questions</th>
                <th className="py-4 text-center">Time per Question</th>
                <th className="py-4 text-center pr-6 w-32">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/40 bg-white/10">
              {quizzes.map((quiz) => (
                <tr key={quiz.id} className="hover:bg-slate-50/40 dark:hover:bg-dark-border/10">
                  <td className="py-4 pl-6 font-bold text-slate-800 dark:text-slate-200">
                    {quiz.title}
                    <span className="block text-[10px] text-slate-400 font-medium truncate max-w-xs mt-0.5">
                      {quiz.description}
                    </span>
                  </td>
                  <td className="py-4 font-semibold text-slate-600 dark:text-slate-300">{quiz.category}</td>
                  <td className="py-4">
                    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-bold border ${
                      quiz.difficulty === 'Easy' 
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-100 dark:bg-emerald-950/10 dark:text-emerald-400 dark:border-emerald-900/30' 
                        : quiz.difficulty === 'Medium'
                          ? 'bg-amber-50 text-amber-700 border-amber-100 dark:bg-amber-950/10 dark:text-amber-400 dark:border-amber-900/30'
                          : 'bg-rose-50 text-rose-700 border-rose-100 dark:bg-rose-950/10 dark:text-rose-400 dark:border-rose-900/30'
                    }`}>
                      {quiz.difficulty}
                    </span>
                  </td>
                  <td className="py-4 text-center font-bold text-slate-700 dark:text-slate-200">
                    {quiz.totalQuestions || quiz.questions?.length || 0}
                  </td>
                  <td className="py-4 text-center font-semibold text-slate-500 dark:text-dark-text-muted">
                    {quiz.timeLimit}s
                  </td>
                  <td className="py-4 text-center pr-6">
                    <div className="flex gap-2 justify-center">
                      <button
                        onClick={() => handleOpenEdit(quiz)}
                        className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-violet-600 hover:border-violet-200 dark:border-slate-800 dark:hover:text-violet-400 dark:hover:border-violet-900/40 cursor-pointer transition-all"
                        title="Edit Quiz"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setIsDeletingId(quiz.id)}
                        className="p-2 rounded-xl border border-slate-200 text-slate-500 hover:text-rose-600 hover:border-rose-200 dark:border-slate-800 dark:hover:text-rose-400 dark:hover:border-rose-900/40 cursor-pointer transition-all"
                        title="Delete Quiz"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {isDeletingId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="glass p-6 sm:p-8 rounded-3xl max-w-sm w-full text-center shadow-2xl border border-slate-200 dark:border-slate-800"
            >
              <AlertTriangle className="w-12 h-12 text-rose-500 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-slate-800 dark:text-slate-100">Delete Quiz</h3>
              <p className="text-xs text-slate-500 dark:text-dark-text-muted mt-2 leading-relaxed">
                Are you absolutely sure you want to delete this quiz? All leaderboard records and history attempts tied to this quiz id will remain in database but this challenge will no longer be playable. This action is irreversible.
              </p>
              <div className="grid grid-cols-2 gap-4 mt-6">
                <button
                  onClick={() => setIsDeletingId(null)}
                  className="py-2.5 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-dark-card dark:text-slate-300 dark:hover:bg-dark-border text-xs font-bold transition-all cursor-pointer active:scale-95"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteQuiz}
                  className="py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-sm"
                >
                  Yes, Delete
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Add / Edit Quiz Form Modal */}
      <AnimatePresence>
        {isQuizModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 30, opacity: 0 }}
              className="glass rounded-3xl max-w-3xl w-full max-h-[85vh] overflow-y-auto shadow-2xl border border-slate-200/60 dark:border-slate-800/50"
            >
              {/* Modal header */}
              <div className="sticky top-0 bg-white/80 dark:bg-dark-card/90 backdrop-blur-md px-6 py-4 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between z-10">
                <h3 className="text-base font-extrabold text-slate-800 dark:text-slate-100">
                  {editingQuiz ? `Edit Quiz: "${editingQuiz.title}"` : "Add New Quiz Challenge"}
                </h3>
                <button
                  onClick={() => setIsQuizModalOpen(false)}
                  className="p-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-dark-border transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Form body */}
              <form onSubmit={handleSaveQuiz} className="p-6 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Quiz Title */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-2">
                      Quiz Title
                    </label>
                    <input
                      type="text"
                      value={formTitle}
                      onChange={(e) => setFormTitle(e.target.value)}
                      placeholder="e.g. CSS Selectors Mastery"
                      disabled={isSaving}
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-500 dark:border-slate-800 dark:bg-dark-bg dark:text-slate-100"
                      required
                    />
                  </div>

                  {/* Quiz Description */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-2">
                      Short Description
                    </label>
                    <input
                      type="text"
                      value={formDescription}
                      onChange={(e) => setFormDescription(e.target.value)}
                      placeholder="e.g. Test your knowledge of complex CSS layouts and styling logic."
                      disabled={isSaving}
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-500 dark:border-slate-800 dark:bg-dark-bg dark:text-slate-100"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Category select */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-2">
                      Category
                    </label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value)}
                      disabled={isSaving}
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/25 dark:border-slate-800 dark:bg-dark-bg dark:text-slate-300"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Difficulty select */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-2">
                      Difficulty Level
                    </label>
                    <select
                      value={formDifficulty}
                      onChange={(e) => setFormDifficulty(e.target.value)}
                      disabled={isSaving}
                      className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-xs font-semibold text-slate-600 focus:outline-none focus:ring-2 focus:ring-violet-500/25 dark:border-slate-800 dark:bg-dark-bg dark:text-slate-300"
                    >
                      {DIFFICULTIES.map((diff) => (
                        <option key={diff} value={diff}>{diff}</option>
                      ))}
                    </select>
                  </div>

                  {/* Time limit */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-2">
                      Time per question (seconds)
                    </label>
                    <input
                      type="number"
                      value={formTimeLimit}
                      onChange={(e) => setFormTimeLimit(Math.max(10, Number(e.target.value)))}
                      min="10"
                      disabled={isSaving}
                      className="w-full px-4 py-2 rounded-2xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-500 dark:border-slate-800 dark:bg-dark-bg dark:text-slate-100"
                      required
                    />
                  </div>
                </div>

                <hr className="border-slate-100 dark:border-slate-800/80" />

                {/* Questions Fields area */}
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-extrabold uppercase text-slate-400 dark:text-dark-text-muted tracking-wider">
                      Questions ({formQuestions.length})
                    </h4>
                    <button
                      type="button"
                      onClick={handleAddQuestionField}
                      disabled={isSaving}
                      className="inline-flex items-center gap-1 py-1.5 px-3 rounded-xl border border-dashed border-violet-300 text-violet-600 dark:border-violet-800 text-[10px] font-extrabold uppercase hover:bg-violet-50 dark:hover:bg-violet-950/20 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Question</span>
                    </button>
                  </div>

                  {formQuestions.map((q, qIdx) => (
                    <div 
                      key={q.id} 
                      className="p-5 bg-slate-50/50 border border-slate-200/50 dark:bg-dark-bg/25 dark:border-slate-800 rounded-3xl relative"
                    >
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestionField(qIdx)}
                        disabled={isSaving}
                        className="absolute right-4 top-4 p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 cursor-pointer transition-colors"
                        title="Remove Question"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>

                      <span className="inline-block text-[9px] font-black uppercase text-violet-500 tracking-wider mb-3">
                        Question {qIdx + 1}
                      </span>

                      {/* Question Text */}
                      <div className="mb-4">
                        <label className="block text-[10px] font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-2">
                          Question Prompt
                        </label>
                        <input
                          type="text"
                          value={q.question}
                          onChange={(e) => handleUpdateQuestion(qIdx, 'question', e.target.value)}
                          placeholder="e.g. Which selector selects elements of a specific class?"
                          disabled={isSaving}
                          className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-500 dark:border-slate-800 dark:bg-dark-bg dark:text-slate-100"
                          required
                        />
                      </div>

                      {/* Options Grid */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
                        {q.options.map((opt, optIdx) => (
                          <div key={optIdx}>
                            <label className="block text-[9px] font-bold text-slate-400 dark:text-dark-text-muted uppercase mb-1.5 pl-1">
                              Option {optIdx + 1}
                            </label>
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => handleUpdateOption(qIdx, optIdx, e.target.value)}
                              placeholder={`Option ${optIdx + 1}`}
                              disabled={isSaving}
                              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-500 dark:border-slate-800 dark:bg-dark-bg dark:text-slate-100"
                              required
                            />
                          </div>
                        ))}
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Correct Answer */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-2">
                            Correct Answer (Must match an option exactly)
                          </label>
                          <input
                            type="text"
                            value={q.correctAnswer}
                            onChange={(e) => handleUpdateQuestion(qIdx, 'correctAnswer', e.target.value)}
                            placeholder="Type correct option value"
                            disabled={isSaving}
                            className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-500 dark:border-slate-800 dark:bg-dark-bg dark:text-slate-100"
                            required
                          />
                        </div>

                        {/* Explanation text */}
                        <div>
                          <label className="block text-[10px] font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider mb-2">
                            Explanation / Tip
                          </label>
                          <input
                            type="text"
                            value={q.explanation}
                            onChange={(e) => handleUpdateQuestion(qIdx, 'explanation', e.target.value)}
                            placeholder="Provide brief logic context for players."
                            disabled={isSaving}
                            className="w-full px-4 py-2.5 rounded-2xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-violet-500/25 focus:border-violet-500 dark:border-slate-800 dark:bg-dark-bg dark:text-slate-100"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Submit panel */}
                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsQuizModalOpen(false)}
                    disabled={isSaving}
                    className="py-2.5 px-5 rounded-xl border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 dark:border-slate-800 dark:bg-dark-card dark:text-slate-300 dark:hover:bg-dark-border text-xs font-bold transition-all cursor-pointer active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-1.5 py-2.5 px-6 rounded-xl bg-slate-900 text-white text-xs font-bold transition-all cursor-pointer active:scale-95 shadow-md hover:bg-violet-600 dark:bg-violet-600 dark:hover:bg-violet-700"
                  >
                    {isSaving ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Saving Changes...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Save Quiz</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
