import React, { useState, useEffect, useRef } from 'react';
import { Timer } from 'lucide-react';

export default function CountdownTimer({ timeLimit, onTimeUp, questionId }) {
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const timerRef = useRef(null);

  // Reset timer whenever the question changes
  useEffect(() => {
    setTimeLeft(timeLimit);
    
    // Clear previous interval if any
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }

    timerRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          onTimeUp(); // Trigger auto-advance callback
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [questionId, timeLimit, onTimeUp]);

  const percentage = timeLeft / timeLimit;
  const radius = 20;
  const strokeWidth = 3.5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - percentage * circumference;

  // Determine color based on time left
  let colorClass = 'stroke-emerald-500 dark:stroke-emerald-400';
  let textClass = 'text-emerald-600 dark:text-emerald-400';
  let bgClass = 'bg-emerald-50/50 dark:bg-emerald-950/10';

  if (percentage <= 0.2) {
    colorClass = 'stroke-rose-500 dark:stroke-rose-400 animate-pulse';
    textClass = 'text-rose-600 dark:text-rose-400 font-extrabold';
    bgClass = 'bg-rose-50/80 dark:bg-rose-950/20';
  } else if (percentage <= 0.5) {
    colorClass = 'stroke-amber-500 dark:stroke-amber-400';
    textClass = 'text-amber-600 dark:text-amber-400';
    bgClass = 'bg-amber-50/50 dark:bg-amber-950/10';
  }

  return (
    <div className={`flex items-center gap-3 px-3.5 py-1.5 rounded-2xl border border-slate-200/50 dark:border-slate-800/40 shadow-sm ${bgClass} transition-colors duration-300`}>
      <Timer className={`w-4 h-4 ${percentage <= 0.2 ? 'animate-bounce text-rose-500' : 'text-slate-500 dark:text-slate-400'}`} />
      
      <div className="relative flex items-center justify-center w-9 h-9">
        {/* SVG Circular Progress Bar */}
        <svg className="w-full h-full transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="18"
            cy="18"
            r={radius}
            className="stroke-slate-200 dark:stroke-slate-800"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Foreground progress circle */}
          <circle
            cx="18"
            cy="18"
            r={radius}
            className={`transition-all duration-1000 ease-linear ${colorClass}`}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
          />
        </svg>
        {/* Timer text inside circle */}
        <span className={`absolute text-xs font-bold ${textClass}`}>
          {timeLeft}s
        </span>
      </div>
    </div>
  );
}
