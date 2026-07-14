import { initializeApp } from 'firebase/app';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

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

const newQuizzes = [
  {
    id: "quiz_css_layouts",
    title: "CSS Layouts & Box Model",
    description: "Challenge your layout styling knowledge on box-sizing, positioning, flexbox, and CSS grid rules.",
    category: "CSS",
    difficulty: "Medium",
    timeLimit: 20,
    totalQuestions: 5,
    questions: [
      {
        id: "quiz_css_q1",
        question: "What is the default value of the position property in CSS?",
        options: ["static", "relative", "absolute", "fixed"],
        correctAnswer: "static",
        points: 10,
        explanation: "The default positioning value for elements is 'static'. It flows naturally in the normal document layout."
      },
      {
        id: "quiz_css_q2",
        question: "Which box-sizing value includes padding and border inside the declared width/height?",
        options: ["content-box", "border-box", "padding-box", "inherit"],
        correctAnswer: "border-box",
        points: 10,
        explanation: "border-box includes the element's padding and borders in its total calculated width and height."
      },
      {
        id: "quiz_css_q3",
        question: "Which flexbox property controls alignment of items along the main axis?",
        options: ["align-items", "justify-content", "align-content", "flex-direction"],
        correctAnswer: "justify-content",
        points: 10,
        explanation: "justify-content defines the alignment along the main axis of the current line of a flex container."
      },
      {
        id: "quiz_css_q4",
        question: "Which selector selects elements with the class 'highlight'?",
        options: ["#highlight", ".highlight", "*highlight", "highlight"],
        correctAnswer: ".highlight",
        points: 10,
        explanation: "A class selector is defined with a dot (.) prefix, while an ID selector uses a hash (#)."
      },
      {
        id: "quiz_css_q5",
        question: "Which display property value initializes CSS Grid layout?",
        options: ["flex", "block", "grid", "inline-grid"],
        correctAnswer: "grid",
        points: 10,
        explanation: "The 'display: grid' rule defines a block-level grid container."
      }
    ]
  },
  {
    id: "quiz_js_es6",
    title: "JavaScript ES6+ Advanced",
    description: "Test your JS scripting fundamentals on scopes, closures, async loops, and destructuring syntax.",
    category: "JavaScript",
    difficulty: "Hard",
    timeLimit: 25,
    totalQuestions: 5,
    questions: [
      {
        id: "quiz_js_q1",
        question: "Which keyword is block-scoped in JavaScript?",
        options: ["var", "let", "function", "global"],
        correctAnswer: "let",
        points: 10,
        explanation: "Both 'let' and 'const' are block-scoped, whereas 'var' is function-scoped."
      },
      {
        id: "quiz_js_q2",
        question: "What is the return type of 'typeof null' in JavaScript?",
        options: ["null", "undefined", "object", "string"],
        correctAnswer: "object",
        points: 10,
        explanation: "Since the first release of JavaScript, null is evaluated as an object. This is a legacy specification behavior."
      },
      {
        id: "quiz_js_q3",
        question: "Which method is used to serialize a JavaScript object into a JSON string?",
        options: ["JSON.parse()", "JSON.stringify()", "Object.toJSON()", "JSON.toObject()"],
        correctAnswer: "JSON.stringify()",
        points: 10,
        explanation: "JSON.stringify() converts a JavaScript object or value to a JSON string."
      },
      {
        id: "quiz_js_q4",
        question: "What does Promise.all() return?",
        options: ["An array of values", "A single Promise", "undefined", "The first resolved promise value"],
        correctAnswer: "A single Promise",
        points: 10,
        explanation: "Promise.all() returns a single Promise that resolves when all input promises resolve, or rejects if any reject."
      },
      {
        id: "quiz_js_q5",
        question: "Which ES6 feature allows unpacking values from arrays or object properties into distinct variables?",
        options: ["Spread", "Rest", "Destructuring", "Interpolation"],
        correctAnswer: "Destructuring",
        points: 10,
        explanation: "Destructuring assignment allows unpacking values from arrays or properties from objects into variables."
      }
    ]
  },
  {
    id: "quiz_html_semantics",
    title: "HTML5 Semantic elements",
    description: "Learn how to structure web documents for accessibility and SEO using Semantic HTML5 elements.",
    category: "HTML",
    difficulty: "Easy",
    timeLimit: 15,
    totalQuestions: 5,
    questions: [
      {
        id: "quiz_html_q1",
        question: "Which semantic element represents introductory content, logos, or navigation links?",
        options: ["<header>", "<section>", "<nav>", "<aside>"],
        correctAnswer: "<header>",
        points: 10,
        explanation: "The <header> element represents a container for introductory content or a set of navigational links."
      },
      {
        id: "quiz_html_q2",
        question: "What is the correct tag for rendering a single line break?",
        options: ["<break>", "<lb>", "<br>", "<hr>"],
        correctAnswer: "<br>",
        points: 10,
        explanation: "<br> is an empty (self-closing) tag that inserts a single line break."
      },
      {
        id: "quiz_html_q3",
        question: "Which image attribute provides description text if the file fails to load?",
        options: ["src", "alt", "title", "href"],
        correctAnswer: "alt",
        points: 10,
        explanation: "The 'alt' attribute provides alternative descriptive text for images for accessibility and search indexing."
      },
      {
        id: "quiz_html_q4",
        question: "Which HTML5 element is used to display embedded video files natively?",
        options: ["<media>", "<video>", "<embed>", "<object>"],
        correctAnswer: "<video>",
        points: 10,
        explanation: "The <video> element allows you to play video files natively in the browser without plugins."
      },
      {
        id: "quiz_html_q5",
        question: "What is the purpose of the <main> element?",
        options: ["Renders sidebar links", "Wraps copyright data", "Represents the dominant content of the body", "Includes head scripts"],
        correctAnswer: "<main>",
        points: 10,
        explanation: "The <main> element represents the dominant content area of the document <body>. It must be unique."
      }
    ]
  },
  {
    id: "quiz_node_core",
    title: "Node.js Core Fundamentals",
    description: "Explore the core server-side concepts of Node.js, event loops, imports, and streams.",
    category: "Node.js",
    difficulty: "Hard",
    timeLimit: 20,
    totalQuestions: 5,
    questions: [
      {
        id: "quiz_node_q1",
        question: "Which core Node.js module is used to handle file path operations?",
        options: ["fs", "url", "path", "os"],
        correctAnswer: "path",
        points: 10,
        explanation: "The core 'path' module provides utilities for working with file and directory paths."
      },
      {
        id: "quiz_node_q2",
        question: "What is Node's standard package manager called?",
        options: ["pip", "npm", "composer", "yarn"],
        correctAnswer: "npm",
        points: 10,
        explanation: "npm (Node Package Manager) is the default package manager for Node.js, hosting modules and libraries."
      },
      {
        id: "quiz_node_q3",
        question: "Which function imports modules in the CommonJS format?",
        options: ["import", "require", "fetch", "load"],
        correctAnswer: "require",
        points: 10,
        explanation: "CommonJS uses the 'require()' statement to import modules, while ES Modules use 'import'."
      },
      {
        id: "quiz_node_q4",
        question: "How does Node.js achieve non-blocking asynchronous operations internally?",
        options: ["Multi-threading", "Event Loop", "Child Processes", "Polling"],
        correctAnswer: "Event Loop",
        points: 10,
        explanation: "The Event Loop allows Node.js to perform non-blocking I/O operations by offloading tasks to the system kernel."
      },
      {
        id: "quiz_node_q5",
        question: "What is the scope of variables declared inside a Node.js file?",
        options: ["Global", "Local to module", "Function block only", "Universal"],
        correctAnswer: "Local to module",
        points: 10,
        explanation: "In Node.js, variables declared inside a file (module) are local to that module, preventing global namespace pollution."
      }
    ]
  }
];

async function uploadMore() {
  console.log("Starting script to upload 4 additional category quizzes to Firestore...");
  try {
    for (const quiz of newQuizzes) {
      await setDoc(doc(db, 'quizzes', quiz.id), quiz);
      console.log(`✅ Uploaded: "${quiz.title}" (${quiz.id}) under category "${quiz.category}"`);
    }
    console.log("All 4 category quizzes successfully uploaded!");
    process.exit(0);
  } catch (error) {
    console.error("Upload failed:", error);
    process.exit(1);
  }
}

uploadMore();
