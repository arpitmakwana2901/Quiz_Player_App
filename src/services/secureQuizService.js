/**
 * Service to handle native browser API features for the secure proctored environment,
 * ensuring compatibility across different browser engines.
 */
export const secureQuizService = {
  /**
   * Request fullscreen mode on a DOM element.
   * @param {HTMLElement} element 
   */
  enterFullscreen: async (element) => {
    if (!element) return;
    try {
      if (element.requestFullscreen) {
        await element.requestFullscreen();
      } else if (element.webkitRequestFullscreen) {
        await element.webkitRequestFullscreen(); // Safari/WebKit support
      } else if (element.msRequestFullscreen) {
        await element.msRequestFullscreen(); // IE/Edge legacy support
      } else if (element.mozRequestFullScreen) {
        await element.mozRequestFullScreen(); // Firefox legacy support
      }
    } catch (error) {
      console.warn("Fullscreen request rejected by browser security settings:", error);
    }
  },

  /**
   * Safe exit from fullscreen mode.
   */
  exitFullscreen: async () => {
    try {
      if (!secureQuizService.isFullscreenActive()) return;
      
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if (document.webkitExitFullscreen) {
        await document.webkitExitFullscreen();
      } else if (document.msExitFullscreen) {
        await document.msExitFullscreen();
      } else if (document.mozCancelFullScreen) {
        await document.mozCancelFullScreen();
      }
    } catch (error) {
      console.warn("Failed to exit fullscreen cleanly:", error);
    }
  },

  /**
   * Verify if fullscreen mode is currently active.
   * @returns {boolean}
   */
  isFullscreenActive: () => {
    return !!(
      document.fullscreenElement ||
      document.webkitFullscreenElement ||
      document.mozFullScreenElement ||
      document.msFullscreenElement
    );
  }
};
