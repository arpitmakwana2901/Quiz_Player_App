import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  limit,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "./config";

/**
 * Saves a score to the leaderboard in Firestore.
 * @param {string} name - Name of the player
 * @param {string} quizId - ID of the quiz
 * @param {string} quizTitle - Title of the quiz
 * @param {number} score - Points scored
 * @param {number} percentage - Correct percentage
 */
export const saveScore = async (name, quizId, quizTitle, score, percentage) => {
  // 1. Validation checks
  if (!name || typeof name !== "string" || name.trim().length < 2) {
    throw new Error("Name must be at least 2 characters long.");
  }
  if (!quizId || typeof quizId !== "string") {
    throw new Error("Valid Quiz ID is required.");
  }
  if (score === undefined || score === null || isNaN(score)) {
    throw new Error("Valid score calculation is required.");
  }
  if (percentage === undefined || percentage === null || isNaN(percentage)) {
    throw new Error("Valid percentage calculation is required.");
  }

  try {
    const docRef = await addDoc(collection(db, "leaderboard"), {
      name: name.trim(),
      quizId,
      quizTitle: quizTitle || "Untitled Quiz",
      score: Number(score),
      percentage: Number(percentage),
      completedAt: serverTimestamp(),
    });
    return { success: true, id: docRef.id };
  } catch (error) {
    console.error("Firestore leaderboard save failed:", error);
    throw error;
  }
};

/**
 * Retrieves the top 10 scores for a specific quiz from Firestore.
 * Sorted by score descending, then by completedAt descending.
 * @param {string} quizId - ID of the quiz
 * @returns {Promise<Array>} - Top 10 scores
 */
export const getTopScores = async (quizId) => {
  if (!quizId) {
    throw new Error("Quiz ID is required to fetch leaderboard.");
  }

  try {
    const q = query(
      collection(db, "leaderboard"),
      where("quizId", "==", quizId),
      orderBy("score", "desc"),
      orderBy("completedAt", "desc"),
      limit(10),
    );

    const querySnapshot = await getDocs(q);
    const scores = [];

    querySnapshot.forEach((doc) => {
      const data = doc.data();

      // Handle serverTimestamp completedAt converting to client Date
      let completedTime = new Date();
      if (data.completedAt) {
        // If it's a Firestore Timestamp, it has toDate()
        completedTime =
          typeof data.completedAt.toDate === "function"
            ? data.completedAt.toDate()
            : new Date(data.completedAt);
      }

      scores.push({
        id: doc.id,
        ...data,
        completedAt: completedTime,
      });
    });

    return scores;
  } catch (error) {
    console.error("Firestore leaderboard fetch failed:", error);
    throw error;
  }
};
