import { useAuth } from '../context/AuthContext';

/**
 * Custom hook consuming global PWA install states from AuthContext.
 */
export function usePWA() {
  const { isInstallable, isStandalone, installApp } = useAuth();
  return {
    isInstallable,
    isStandalone,
    installApp
  };
}
