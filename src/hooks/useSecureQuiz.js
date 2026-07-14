import { useState, useEffect, useRef } from 'react';
import { secureQuizService } from '../services/secureQuizService';

const MAX_WARNINGS = 3;

/**
 * Custom hook to enforce anti-cheating restrictions during a quiz.
 * 
 * @param {boolean} active - Whether proctoring checks are currently running.
 * @param {Function} onViolation - Callback when a violation is detected. Receives (reason, warningsRemaining).
 * @param {Function} onAutoSubmit - Callback when violations reach the limit. Receives (reason).
 */
export function useSecureQuiz({ active, onViolation, onAutoSubmit }) {
  const [violationCount, setViolationCount] = useState(0);
  const [warningsRemaining, setWarningsRemaining] = useState(MAX_WARNINGS);
  
  // Refs to keep track of current states in listeners without re-binding
  const activeRef = useRef(active);
  const violationCountRef = useRef(0);
  const onViolationRef = useRef(onViolation);
  const onAutoSubmitRef = useRef(onAutoSubmit);
  
  // Throttle refs to avoid duplicate triggers for a single tab switch/blur event
  const lastViolationTime = useRef(0);

  useEffect(() => {
    activeRef.current = active;
  }, [active]);

  useEffect(() => {
    onViolationRef.current = onViolation;
  }, [onViolation]);

  useEffect(() => {
    onAutoSubmitRef.current = onAutoSubmit;
  }, [onAutoSubmit]);

  // Handler to register a new violation
  const registerViolation = (reason) => {
    if (!activeRef.current) return;
    
    // Throttle checks to 1 second window to prevent event cascades (e.g. blur followed immediately by visibilitychange)
    const now = Date.now();
    if (now - lastViolationTime.current < 1000) return;
    lastViolationTime.current = now;

    const nextViolations = violationCountRef.current + 1;
    const nextWarnings = Math.max(0, MAX_WARNINGS - nextViolations);
    
    violationCountRef.current = nextViolations;
    setViolationCount(nextViolations);
    setWarningsRemaining(nextWarnings);

    if (nextViolations >= MAX_WARNINGS) {
      if (onAutoSubmitRef.current) {
        onAutoSubmitRef.current(reason);
      }
    } else {
      if (onViolationRef.current) {
        onViolationRef.current(reason, nextWarnings);
      }
    }
  };

  useEffect(() => {
    if (!active) return;

    // 1. Keyboard Restrictions: Disable Copy, Paste, Print, Save, view source, DevTools keys
    const handleKeyDown = (e) => {
      const isCtrl = e.ctrlKey || e.metaKey;
      const isShift = e.shiftKey;
      const key = e.key.toLowerCase();

      // Block Ctrl+C (copy), Ctrl+V (paste), Ctrl+X (cut), Ctrl+A (select all)
      if (isCtrl && (key === 'c' || key === 'v' || key === 'x' || key === 'a')) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      // Block Ctrl+P (print), Ctrl+S (save), Ctrl+U (view source)
      if (isCtrl && (key === 'p' || key === 's' || key === 'u')) {
        e.preventDefault();
        e.stopPropagation();
        return;
      }

      // Block F12 (DevTools)
      if (e.key === 'F12' || e.keyCode === 123) {
        e.preventDefault();
        e.stopPropagation();
        registerViolation('devtools_attempt');
        return;
      }

      // Block Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+Shift+C (DevTools panels)
      if (isCtrl && isShift && (key === 'i' || key === 'j' || key === 'c')) {
        e.preventDefault();
        e.stopPropagation();
        registerViolation('devtools_attempt');
        return;
      }
    };

    // 2. Disable context menu (right click)
    const handleContextMenu = (e) => {
      e.preventDefault();
    };

    // 3. Disable text copying / cutting / pasting events natively
    const handleCopyPasteCut = (e) => {
      e.preventDefault();
    };

    // 4. Disable drag and drop selections
    const handleDragStart = (e) => {
      e.preventDefault();
    };

    // 5. Disable text selection initialization
    const handleSelectStart = (e) => {
      e.preventDefault();
    };

    // 6. Monitor fullscreen exits
    const handleFullscreenChange = () => {
      if (activeRef.current && !secureQuizService.isFullscreenActive()) {
        registerViolation('fullscreen_exit');
      }
    };

    // 7. Monitor visibility states (Tab switching or browser minimizations)
    const handleVisibilityChange = () => {
      if (document.hidden || document.visibilityState === 'hidden') {
        registerViolation('tab_switch');
      }
    };

    // 8. Monitor Window focus loss (blur event)
    const handleWindowBlur = () => {
      registerViolation('window_blur');
    };

    // 9. Basic DevTools detection: check outer vs inner viewport dimensions on resize
    const handleResize = () => {
      const threshold = 160;
      const isDevToolsDocked =
        window.outerWidth - window.innerWidth > threshold ||
        window.outerHeight - window.innerHeight > threshold;
        
      if (isDevToolsDocked) {
        registerViolation('devtools_docked');
      }
    };

    // Register all restrictions
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('contextmenu', handleContextMenu);
    window.addEventListener('copy', handleCopyPasteCut);
    window.addEventListener('paste', handleCopyPasteCut);
    window.addEventListener('cut', handleCopyPasteCut);
    window.addEventListener('dragstart', handleDragStart);
    window.addEventListener('selectstart', handleSelectStart);
    
    // Register proctoring state listeners
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('MSFullscreenChange', handleFullscreenChange);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    window.addEventListener('resize', handleResize);

    // Initial check: ensure fullscreen remains active
    const checkFullscreen = setInterval(() => {
      if (activeRef.current && !secureQuizService.isFullscreenActive()) {
        registerViolation('fullscreen_exit');
      }
    }, 2000);

    // Cleanup all bindings on quiz termination
    return () => {
      clearInterval(checkFullscreen);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('contextmenu', handleContextMenu);
      window.removeEventListener('copy', handleCopyPasteCut);
      window.removeEventListener('paste', handleCopyPasteCut);
      window.removeEventListener('cut', handleCopyPasteCut);
      window.removeEventListener('dragstart', handleDragStart);
      window.removeEventListener('selectstart', handleSelectStart);
      
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      window.removeEventListener('resize', handleResize);
    };
  }, [active]);

  return {
    violationCount,
    warningsRemaining
  };
}
