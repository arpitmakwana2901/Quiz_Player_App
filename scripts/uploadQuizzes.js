import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Firebase configuration matching the user project credentials
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
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Obtain directories in ES modules environment
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const jsonPath = join(__dirname, '../src/data/quizzes.json');

async function uploadQuizzes() {
  console.log("--------------------------------------------------");
  console.log("Starting Firebase Firestore Quiz Migration Script");
  console.log("--------------------------------------------------");

  try {
    // Read local quizzes JSON
    const fileContent = readFileSync(jsonPath, 'utf8');
    const data = JSON.parse(fileContent);

    if (!data || !data.quizzes || !Array.isArray(data.quizzes)) {
      throw new Error("Invalid quizzes.json structure. Missing quizzes array.");
    }

    console.log(`Found ${data.quizzes.length} quizzes in local JSON. Uploading to Firestore...\n`);

    for (const quiz of data.quizzes) {
      console.log(`Processing: "${quiz.title}" (${quiz.id})`);

      // Construct Firestore Quiz document mapping timePerQuestion ➔ timeLimit
      const firestoreQuiz = {
        title: quiz.title,
        description: quiz.description,
        category: quiz.category,
        difficulty: quiz.difficulty,
        timeLimit: quiz.timePerQuestion, // schema mapping as requested
        totalQuestions: quiz.totalQuestions || quiz.questions.length,
        questions: quiz.questions.map((q) => ({
          id: q.id,
          question: q.question,
          options: q.options,
          correctAnswer: q.correctAnswer,
          points: q.points || 10,
          explanation: q.explanation || ''
        }))
      };

      // Set document with quiz.id to avoid duplicate uploads
      await setDoc(doc(db, 'quizzes', quiz.id), firestoreQuiz);
      console.log(`✅ Success: Uploaded "${quiz.title}" as doc "${quiz.id}"`);
    }

    console.log("\n--------------------------------------------------");
    console.log("🎉 Migration Completed Successfully! All quizzes uploaded.");
    console.log("--------------------------------------------------");
    process.exit(0);
  } catch (error) {
    console.error("\n❌ Migration Failed with Error:", error.message);
    console.error(error);
    process.exit(1);
  }
}

uploadQuizzes();
