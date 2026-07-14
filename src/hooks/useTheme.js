import { useContext } from 'react';
import { ThemeContext } from '../context/ThemeContext';

/**
 * Reusable hook to consume the global theme context.
 * Exposes theme ('light' | 'dark') and toggleTheme callback.
 */
export function useTheme() {
  const context = useContext(ThemeContext);
  
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  
  return context;
}
