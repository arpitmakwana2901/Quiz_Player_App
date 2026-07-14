import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from './config';

/**
 * Fetches all quizzes from the Firestore quizzes collection.
 * @returns {Promise<Array>} - List of quizzes
 */
export const fetchQuizzes = async () => {
  try {
    const querySnapshot = await getDocs(collection(db, 'quizzes'));
    const quizzes = [];
    querySnapshot.forEach((doc) => {
      quizzes.push({
        id: doc.id,
        ...doc.data()
      });
    });
    return quizzes;
  } catch (error) {
    console.error("Firestore quizzes fetch failed:", error);
    throw error;
  }
};

/**
 * Fetches a single quiz by its document ID from Firestore.
 * @param {string} id - Document ID
 * @returns {Promise<Object>} - The quiz object
 */
export const fetchQuizById = async (id) => {
  if (!id) {
    throw new Error("Quiz ID is required.");
  }
  
  try {
    const docRef = doc(db, 'quizzes', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return {
        id: docSnap.id,
        ...docSnap.data()
      };
    } else {
      throw new Error("Quiz not found in Firestore.");
    }
  } catch (error) {
    console.error(`Firestore fetch for quiz ${id} failed:`, error);
    throw error;
  }
};
