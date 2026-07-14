import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { fetchQuizById } from '../firebase/quizzes';
import ProgressBar from '../components/ProgressBar';
import CountdownTimer from '../components/CountdownTimer';
import SecureQuizWarning from '../components/SecureQuizWarning';
import { useSecureQuiz } from '../hooks/useSecureQuiz';
import { secureQuizService } from '../services/secureQuizService';
import { 
  ArrowLeft, Play, ArrowRight, HelpCircle, BookOpen, AlertTriangle, 
  Loader2, Shield, Lock, Info 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function QuizPlay() {
  const { id } = useParams();
  const navigate = useNavigate();

  // States
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [gameState, setGameState] = useState('intro'); // 'intro' | 'playing'
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState(null);
  const [answersHistory, setAnswersHistory] = useState([]);
  const [startTime, setStartTime] = useState(null);

  // Proctoring States
  const [isProctorActive, setIsProctorActive] = useState(false);
  const [isWarningOpen, setIsWarningOpen] = useState(false);
  const [activeViolationReason, setActiveViolationReason] = useState(null);

  // Ref to get latest answers history inside callbacks
  const answersHistoryRef = useRef([]);
  useEffect(() => {
    answersHistoryRef.current = answersHistory;
  }, [answersHistory]);

  // Fetch quiz details from database
  useEffect(() => {
    let active = true;
    const getQuiz = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await fetchQuizById(id);
        if (active) {
          setQuiz(data);
        }
      } catch (err) {
        console.error(err);
        if (active) {
          setError(err.message || 'Failed to load the quiz from the database.');
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };
    getQuiz();
    return () => {
      active = false;
    };
  }, [id]);

  const currentQuestion = quiz?.questions?.[currentQuestionIndex];
  const isLastQuestion = quiz ? currentQuestionIndex === quiz.questions.length - 1 : false;

  // Auto Submission logic
  const handleAutoSubmit = useCallback((reason) => {
    if (!quiz) return;
    setIsProctorActive(false);
    setIsWarningOpen(false);

    // Calculate score for completed answers
    const currentHistory = answersHistoryRef.current;
    const correctCount = currentHistory.filter(h => h.isCorrect).length;
    const wrongCount = quiz.questions.length - correctCount;
    const score = currentHistory.reduce((acc, h) => acc + h.pointsEarned, 0);
    const percentage = Math.round((correctCount / quiz.questions.length) * 100);
    const durationSeconds = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;

    // Exit browser fullscreen safely
    secureQuizService.exitFullscreen();

    // Map computer codes to user-friendly text
    const getSubmitReasonText = (code) => {
      if (code === 'fullscreen_exit') return 'Fullscreen Exited multiple times';
      if (code === 'tab_switch') return 'Tab switched during quiz';
      if (code === 'window_blur') return 'Window focus lost (blur)';
      if (code === 'devtools_attempt' || code === 'devtools_docked') return 'Developer Tools opened';
      return 'Multiple security violations';
    };

    // Navigate to results page with auto-submit flags
    navigate(`/quiz/${quiz.id}/result`, {
      state: {
        quizId: quiz.id,
        quizTitle: quiz.title,
        quizCategory: quiz.category || 'Programming',
        score,
        correctCount,
        wrongCount,
        percentage,
        answersHistory: currentHistory,
        timeTaken: durationSeconds,
        autoSubmitted: true,
        submissionReason: getSubmitReasonText(reason),
        violationCount: 3
      },
      replace: true
    });
  }, [quiz, startTime, navigate]);

  // Hook up anti-cheating monitors
  const { violationCount, warningsRemaining } = useSecureQuiz({
    active: isProctorActive,
    onViolation: (reason, remaining) => {
      // Pause proctor checks temporarily to let them resolve dialog
      setIsProctorActive(false);
      setActiveViolationReason(reason);
      setIsWarningOpen(true);
    },
    onAutoSubmit: handleAutoSubmit
  });

  // Action to request fullscreen and start monitors
  const handleStartQuiz = async () => {
    setGameState('playing');
    setStartTime(Date.now());
    
    // Request fullscreen on root element
    await secureQuizService.enterFullscreen(document.documentElement);
    setIsProctorActive(true);
  };

  // Action to resume after warning alert is closed
  const handleResumeQuiz = async () => {
    setIsWarningOpen(false);
    // Request fullscreen re-entry
    await secureQuizService.enterFullscreen(document.documentElement);
    setIsProctorActive(true);
  };

  // Clean up fullscreen on leaving page
  useEffect(() => {
    return () => {
      secureQuizService.exitFullscreen();
    };
  }, []);

  // Handles movement to next question or completion
  const handleNext = useCallback((forcedAnswerValue = undefined) => {
    if (!quiz || !currentQuestion) return;

    const chosenAnswer = forcedAnswerValue !== undefined ? forcedAnswerValue : selectedOption;
    
    // Save to answers history
    const isCorrect = chosenAnswer === currentQuestion.correctAnswer;
    const newAnswerRecord = {
      questionId: currentQuestion.id,
      questionText: currentQuestion.question,
      options: currentQuestion.options,
      selectedAnswer: chosenAnswer,
      correctAnswer: currentQuestion.correctAnswer,
      explanation: currentQuestion.explanation,
      isCorrect,
      pointsEarned: isCorrect ? (currentQuestion.points || 10) : 0
    };

    const updatedHistory = [...answersHistory, newAnswerRecord];
    setAnswersHistory(updatedHistory);

    if (isLastQuestion) {
      setIsProctorActive(false); // Disable proctoring on completion
      secureQuizService.exitFullscreen();

      const correctCount = updatedHistory.filter(h => h.isCorrect).length;
      const wrongCount = quiz.questions.length - correctCount;
      const score = updatedHistory.reduce((acc, h) => acc + h.pointsEarned, 0);
      const percentage = Math.round((correctCount / quiz.questions.length) * 100);
      const durationSeconds = startTime ? Math.round((Date.now() - startTime) / 1000) : 0;

      navigate(`/quiz/${quiz.id}/result`, {
        state: {
          quizId: quiz.id,
          quizTitle: quiz.title,
          quizCategory: quiz.category || 'Programming',
          score,
          correctCount,
          wrongCount,
          percentage,
          answersHistory: updatedHistory,
          timeTaken: durationSeconds,
          autoSubmitted: false,
          submissionReason: null,
          violationCount
        },
        replace: true
      });
    } else {
      setCurrentQuestionIndex((prev) => prev + 1);
      setSelectedOption(null); // Reset selection
    }
  }, [currentQuestionIndex, selectedOption, answersHistory, isLastQuestion, quiz, currentQuestion, startTime, navigate, violationCount]);

  // Handle timer running out
  const handleTimeUp = useCallback(() => {
    handleNext(null); // Skip with incorrect answer
  }, [handleNext]);

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-10 h-10 text-violet-600 animate-spin" />
        <span className="text-sm font-semibold text-slate-500 dark:text-dark-text-muted">
          Loading challenge details...
        </span>
      </div>
    );
  }

  // Render error if quiz doesn't exist
  if (error || !quiz) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center">
        <div className="w-16 h-16 rounded-full bg-rose-50 dark:bg-rose-950/20 flex items-center justify-center mx-auto mb-5 text-rose-600 dark:text-rose-400">
          <AlertTriangle className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-bold text-slate-800 dark:text-slate-100 mb-2">Quiz Not Found</h2>
        <p className="text-sm text-slate-500 dark:text-dark-text-muted mb-6 leading-relaxed">
          {error || "The quiz you are trying to access does not exist or has been removed."}
        </p>
        <Link 
          to="/"
          className="inline-flex items-center gap-1.5 py-2.5 px-6 rounded-xl bg-slate-900 text-white font-semibold text-xs tracking-wide hover:bg-violet-600 active:scale-95 transition-all dark:bg-violet-600 dark:hover:bg-violet-700"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Quizzes</span>
        </Link>
      </div>
    );
  }

  // Transitions
  const pageVariants = {
    hidden: { opacity: 0, scale: 0.98 },
    visible: { opacity: 1, scale: 1, transition: { duration: 0.3 } },
    exit: { opacity: 0, scale: 0.98, transition: { duration: 0.2 } }
  };

  const questionVariants = {
    initial: { x: 50, opacity: 0 },
    animate: { x: 0, opacity: 1, transition: { type: 'spring', stiffness: 300, damping: 25 } },
    exit: { x: -50, opacity: 0, transition: { duration: 0.2 } }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10 select-none">
      <AnimatePresence mode="wait">
        {gameState === 'intro' ? (
          /* Rules / Intro Screen */
          <motion.div
            key="intro"
            variants={pageVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="glass p-6 sm:p-10 rounded-3xl shadow-lg border border-slate-200/50 dark:border-slate-800/40"
          >
            <Link 
              to="/" 
              className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-dark-text-muted dark:hover:text-slate-200 mb-6 group cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
              <span>Back to Listing</span>
            </Link>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-800 dark:text-slate-100 mb-2">
              {quiz.title}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-dark-text-muted mb-6 sm:mb-8 leading-relaxed">
              {quiz.description}
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
              <div className="glass-card p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-white/40 dark:bg-dark-card/30">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-dark-text-muted font-bold block mb-1">
                  Format
                </span>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <HelpCircle className="w-4 h-4 text-violet-500" /> {quiz.totalQuestions} Questions
                </span>
              </div>
              <div className="glass-card p-4 rounded-2xl border border-slate-100 dark:border-slate-800/80 bg-white/40 dark:bg-dark-card/30">
                <span className="text-[10px] uppercase tracking-wider text-slate-400 dark:text-dark-text-muted font-bold block mb-1">
                  Time Budget
                </span>
                <span className="text-sm font-bold text-slate-700 dark:text-slate-200 flex items-center gap-1.5">
                  <BookOpen className="w-4 h-4 text-fuchsia-500" /> {quiz.timeLimit} seconds per question
                </span>
              </div>
            </div>

            {/* Anti-Cheating Secure Mode Warning Notice */}
            <div className="bg-amber-50/50 dark:bg-amber-950/10 border border-amber-200/40 dark:border-amber-900/30 rounded-2xl p-5 mb-6 flex items-start gap-3">
              <Shield className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5 animate-pulse" />
              <div>
                <h4 className="text-xs font-bold text-amber-800 dark:text-amber-400 uppercase tracking-wide">
                  Proctoring Notice: Secure Mode Enabled
                </h4>
                <p className="text-[11px] text-amber-700 dark:text-amber-500/80 mt-1 leading-relaxed">
                  This quiz requires fullscreen access. Switching tabs, minimizing windows, clicking outside the screen, or opening browser developer consoles triggers security warnings. Reaching 3 warnings automatically terminates and saves your run.
                </p>
              </div>
            </div>

            {/* Rules Board */}
            <div className="bg-violet-50/50 dark:bg-violet-950/10 border border-violet-100 dark:border-violet-900/30 rounded-2xl p-5 mb-8">
              <h3 className="text-xs font-bold text-violet-800 dark:text-violet-400 uppercase tracking-widest mb-3">
                Rules of Engagement
              </h3>
              <ul className="space-y-2 text-xs text-slate-600 dark:text-slate-300 leading-relaxed list-disc list-inside">
                <li>Only one option can be selected per question.</li>
                <li>The <strong className="font-semibold text-slate-800 dark:text-slate-100">Next</strong> button unlocks only after making a selection.</li>
                <li>If the timer reaches <strong className="font-bold text-rose-500">0 seconds</strong>, it automatically advances.</li>
                <li>You <strong className="font-semibold text-slate-800 dark:text-slate-100">cannot go back</strong> to previous questions.</li>
              </ul>
            </div>

            <button
              onClick={handleStartQuiz}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 py-3.5 px-8 rounded-2xl bg-gradient-to-tr from-violet-600 to-fuchsia-600 text-white font-bold text-sm shadow-lg shadow-violet-500/20 hover:scale-[1.02] active:scale-98 transition-all hover:brightness-105 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              <span>Start Monitored Quiz</span>
            </button>
          </motion.div>
        ) : (
          /* Active Playing Page */
          <motion.div
            key="playing"
            variants={pageVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex flex-col gap-6"
          >
            {/* Header HUD panel (Timer & Progress Bar) */}
            <div className="glass p-5 rounded-3xl flex flex-col gap-4 shadow-sm border border-slate-200/50 dark:border-slate-800/40">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-800 dark:text-slate-200 leading-tight">
                    {quiz.title}
                  </h2>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[9px] font-black uppercase bg-violet-100 text-violet-700 dark:bg-violet-950/20 dark:text-violet-400 border border-violet-200/20 px-2 py-0.5 rounded-full">
                      {quiz.category}
                    </span>
                    <span className="text-[9px] font-black uppercase bg-rose-50 text-rose-700 dark:bg-rose-950/20 dark:text-rose-400 border border-rose-200/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                      <Lock className="w-2.5 h-2.5" /> Proctor Active
                    </span>
                    <span className="text-[9px] font-black uppercase bg-amber-50 text-amber-700 dark:bg-amber-950/20 dark:text-amber-400 border border-amber-200/20 px-2 py-0.5 rounded-full">
                      Warnings left: {warningsRemaining}
                    </span>
                  </div>
                </div>
                
                {/* Countdown Timer */}
                <CountdownTimer
                  timeLimit={quiz.timeLimit}
                  onTimeUp={handleTimeUp}
                  questionId={currentQuestion.id}
                />
              </div>

              {/* Progress bar */}
              <ProgressBar current={currentQuestionIndex + 1} total={quiz.questions.length} />
            </div>

            {/* Question Box with slide animations */}
            <div className="relative overflow-hidden min-h-[350px]">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentQuestion.id}
                  variants={questionVariants}
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  className="glass p-6 sm:p-8 rounded-3xl border border-slate-200/50 dark:border-slate-800/40 shadow-md flex flex-col justify-between h-full"
                >
                  <div>
                    {/* Question Point Value and Question text */}
                    <div className="flex items-center gap-1.5 mb-4">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-violet-100 dark:bg-violet-950/40 text-violet-700 dark:text-violet-400">
                        +{currentQuestion.points || 10} Points
                      </span>
                    </div>
                    
                    <h2 className="text-lg sm:text-xl font-bold text-slate-800 dark:text-slate-100 leading-snug mb-6">
                      {currentQuestion.question}
                    </h2>

                    {/* Options Grid */}
                    <div className="grid grid-cols-1 gap-3.5 mb-8">
                      {currentQuestion.options.map((option, idx) => {
                        const isSelected = selectedOption === option;
                        const optionLabels = ['A', 'B', 'C', 'D'];
                        
                        return (
                          <motion.button
                            key={idx}
                            onClick={() => setSelectedOption(option)}
                            className={`w-full flex items-center gap-4 p-4 rounded-2xl border text-left text-sm font-semibold transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-violet-600/10 border-violet-600 text-violet-700 dark:bg-violet-500/10 dark:border-violet-500 dark:text-violet-300 ring-2 ring-violet-500/20'
                                : 'bg-white/50 border-slate-200 hover:bg-slate-100/50 text-slate-700 hover:border-slate-300 dark:bg-dark-card/50 dark:border-slate-800 dark:hover:bg-dark-border/40 dark:text-slate-300'
                            }`}
                            whileTap={{ scale: 0.99 }}
                          >
                            <span className={`w-7 h-7 flex items-center justify-center rounded-xl text-xs font-bold border transition-colors ${
                              isSelected
                                ? 'bg-violet-600 border-violet-600 text-white dark:bg-violet-500'
                                : 'bg-slate-50 border-slate-200 text-slate-500 dark:bg-dark-bg dark:border-slate-800 dark:text-slate-400'
                            }`}>
                              {optionLabels[idx]}
                            </span>
                            <span className="flex-grow">{option}</span>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Submit / Next Button */}
                  <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800/80">
                    <button
                      onClick={() => handleNext()}
                      disabled={selectedOption === null}
                      className={`inline-flex items-center gap-1.5 py-3 px-6 rounded-2xl font-bold text-xs tracking-wider uppercase transition-all shadow-md ${
                        selectedOption !== null
                          ? 'bg-slate-900 hover:bg-violet-600 text-white hover:shadow-violet-500/10 active:scale-95 cursor-pointer dark:bg-violet-600 dark:hover:bg-violet-700'
                          : 'bg-slate-100 border border-slate-200 text-slate-400 cursor-not-allowed dark:bg-dark-card dark:border-slate-800/80 dark:text-slate-600 dark:shadow-none'
                      }`}
                    >
                      <span>{isLastQuestion ? 'Submit & Finish' : 'Next Question'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Proctor Violation Modal Alert popup overlay */}
      <SecureQuizWarning 
        isOpen={isWarningOpen}
        reason={activeViolationReason}
        warningsRemaining={warningsRemaining}
        onResume={handleResumeQuiz}
      />
    </div>
  );
}
