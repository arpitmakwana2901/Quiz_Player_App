# 🧠 BrainQuest - Interactive Quiz Player

BrainQuest is a responsive Quiz Player built with **React (Vite)** that allows users to play quizzes, view their results, and save their scores to a Firebase Firestore leaderboard.

The project is designed with a clean UI, smooth user experience, and Firebase integration for storing leaderboard data.

---

# 🚀 Tech Stack

* React.js (Vite)
* React Router DOM
* Tailwind CSS
* Firebase Firestore
* Framer Motion (for animations)

---

# ✨ Features

* Browse available quizzes
* Play quizzes with multiple-choice questions
* Instant answer validation
* Quiz timer
* Progress indicator
* Score calculation
* Percentage calculation
* Review all questions after quiz completion
* Save score to Firebase Firestore
* Top 10 leaderboard for each quiz
* Responsive design for desktop and mobile

---

# 📁 Project Structure

```text
src
│
├── components
├── pages
├── firebase
│     ├── config.js
│     └── leaderboard.js
│
├── data
├── hooks
├── utils
├── assets
└── App.jsx
```

---

# 🔥 Firebase Integration

The project uses **Firebase Firestore** for storing leaderboard data.

### Firestore Collections

## quizzes

Stores quiz information and questions.

```text
quizzes
   ├── quiz_1
   ├── quiz_2
   ├── quiz_3
   └── ...
```

Each quiz document contains:

* id
* title
* description
* questions
* options
* correctAnswer
* explanation
* points

---

## leaderboard

Stores user scores.

```text
leaderboard

   ├── document1

   ├── document2

   └── ...
```

Each document contains:

* name
* quizId
* quizTitle
* score
* percentage
* completedAt

---

# 📊 Leaderboard Logic

After completing a quiz:

1. User enters their name.
2. Score is calculated.
3. Percentage is calculated.
4. Data is stored in Firestore.
5. Top 10 scores are fetched for the selected quiz.
6. Results are sorted by:

   * Highest score (Descending)
   * Latest completion time (Descending)

---

# ⚙️ Installation

Clone the repository

```bash
git clone <repository-url>
```

Install dependencies

```bash
npm install
```

Run development server

```bash
npm run dev
```

Build production version

```bash
npm run build
```

---

# 🔐 Environment Variables

Create a `.env` file in the project root.

```env
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
```

---

# 🔥 Firebase Setup

## Step 1

Create a Firebase Project.

---

## Step 2

Enable Firestore Database.

---

## Step 3

Create a Web App.

---

## Step 4

Copy Firebase configuration into the `.env` file.

---

## Step 5

Set Firestore Rules during development.

```javascript
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    match /{document=**} {
      allow read, write: if true;
    }

  }
}
```

---

## Step 6

Create Composite Index for Leaderboard Query.

Collection

```text
leaderboard
```

Fields

* quizId (Ascending)
* score (Descending)
* completedAt (Descending)

This index is required for the leaderboard query that filters by quiz and sorts by score and completion time.

---

# 📈 Quiz Flow

```text
Home

↓

Quiz List

↓

Select Quiz

↓

Play Quiz

↓

Submit Answers

↓

Result Page

↓

Enter Name

↓

Save Score

↓

Firestore

↓

Top 10 Leaderboard
```

---

# 🎯 Current Functionality

* Quiz listing
* Quiz player
* Timer
* Progress tracking
* Result calculation
* Review answers
* Firebase Firestore integration
* Save leaderboard scores
* Top 10 leaderboard
* Responsive UI

---

# 🚧 Future Improvements

* User Authentication
* Quiz Categories
* Difficulty Levels
* Search & Filter
* Admin Dashboard
* Quiz Creation Panel
* Dark / Light Theme Toggle
* User Profile
* Analytics Dashboard

---

# 👨‍💻 Developed By

**Arpit Makwana**

MERN Stack Developer

* React.js
* Node.js
* Express.js
* MongoDB
* Firebase


---
