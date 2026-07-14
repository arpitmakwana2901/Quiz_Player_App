import { initializeApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyDi3TTX1s8agTpwJm85mXFtDK9JElwHIYM",
  authDomain: "quiz-player-df91b.firebaseapp.com",
  projectId: "quiz-player-df91b",
  storageBucket: "quiz-player-df91b.firebasestorage.app",
  messagingSenderId: "530459803003",
  appId: "1:530459803003:web:f8ba07c0679e3831e311de",
  measurementId: "G-2743CM8HFQ"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
const db = getFirestore(app);
const auth = getAuth(app);

console.log("Firebase Firestore and Authentication initialized successfully.");

export const isFirebaseEnabled = true;
export { db, auth };
