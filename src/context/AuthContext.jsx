import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  updateProfile, 
  onAuthStateChanged 
} from 'firebase/auth';
import { doc, setDoc, deleteDoc, serverTimestamp, onSnapshot, collection } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { toast } from 'react-toastify';

// Create React Context
const AuthContext = createContext();

// Custom hook to consume context
export function useAuth() {
  return useContext(AuthContext);
}

// Context Provider Component
export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userData, setUserData] = useState(null);
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(true);

  // PWA installation states
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  // Sign up a new user
  const register = async (fullName, email, password) => {
    try {
      // 1. Create user in Firebase Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // 2. Update Firebase auth displayName
      await updateProfile(user, {
        displayName: fullName
      });

      // 3. Create document in Firestore users/{uid} collection (default role = user)
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        fullName: fullName.trim(),
        email: email.trim(),
        role: 'user',
        isAdmin: false,
        recentlyPlayed: [],
        createdAt: serverTimestamp()
      });

      return user;
    } catch (error) {
      console.error("Registration flow failed:", error);
      throw error;
    }
  };

  // Sign in an existing user
  const login = (email, password) => {
    return signInWithEmailAndPassword(auth, email, password);
  };

  // Sign out the current user
  const logout = () => {
    return signOut(auth);
  };

  // Toggle favorite quiz
  const toggleFavorite = async (quizId) => {
    if (!currentUser) throw new Error("Authentication required to favorite quizzes.");
    
    const isFav = favorites.includes(quizId);
    const favDocRef = doc(db, 'users', currentUser.uid, 'favorites', quizId);

    try {
      if (isFav) {
        // Delete favorite document
        await deleteDoc(favDocRef);
      } else {
        // Create favorite document
        await setDoc(favDocRef, {
          quizId,
          favoritedAt: serverTimestamp()
        });
      }
    } catch (error) {
      console.error(`Failed to toggle favorite for quiz ${quizId}:`, error);
      throw error;
    }
  };

  // Listen for browser PWA installation triggers
  useEffect(() => {
    const checkStandalone = () => {
      const isStandaloneMode = 
        window.matchMedia('(display-mode: standalone)').matches || 
        window.navigator.standalone || 
        document.referrer.includes('android-app://');
      setIsStandalone(isStandaloneMode);
    };

    checkStandalone();

    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setIsInstallable(false);
      setIsStandalone(true);
      toast.success("BrainQuest installed successfully!");
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installApp = async () => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setIsInstallable(false);
    return outcome === 'accepted';
  };

  // Listen to Auth State changes & synchronize Firestore profile updates
  useEffect(() => {
    let unsubscribeUser = () => {};
    let unsubscribeFavs = () => {};

    const unsubscribeAuth = onAuthStateChanged(auth, async (user) => {
      // Clean up previous listeners
      unsubscribeUser();
      unsubscribeFavs();

      if (user) {
        setCurrentUser(user);

        // 1. Subscribe to User Profile metadata in Firestore
        const userDocRef = doc(db, 'users', user.uid);
        unsubscribeUser = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            setUserData(docSnap.data());
          } else {
            // Default placeholder profile metadata if document is missing
            setUserData({
              fullName: user.displayName || 'Player',
              email: user.email,
              role: 'user',
              isAdmin: false,
              recentlyPlayed: []
            });
          }
        }, (err) => {
          console.error("Firestore user doc sub failed:", err);
        });

        // 2. Subscribe to User Favorites subcollection in Firestore
        const favsColRef = collection(db, 'users', user.uid, 'favorites');
        unsubscribeFavs = onSnapshot(favsColRef, (querySnap) => {
          const favIds = [];
          querySnap.forEach((doc) => {
            favIds.push(doc.id); // Doc ID is the quizId
          });
          setFavorites(favIds);
          setLoading(false); // Auth loading completed
        }, (err) => {
          console.error("Firestore favorites sub failed:", err);
          setLoading(false);
        });

      } else {
        setCurrentUser(null);
        setUserData(null);
        setFavorites([]);
        setLoading(false);
      }
    });

    return () => {
      unsubscribeAuth();
      unsubscribeUser();
      unsubscribeFavs();
    };
  }, []);

  const value = {
    currentUser,
    userData,
    favorites,
    toggleFavorite,
    loading,
    login,
    register,
    logout,
    isInstallable,
    isStandalone,
    installApp
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}
