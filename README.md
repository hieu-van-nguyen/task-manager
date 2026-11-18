# Task Manager

A personal task manager built with **React 19**, **TypeScript**, and **Firebase**. Sign in with Google, then create, organize, filter, and track your own tasks. Each user only sees their own tasks.

## Features

- **Google sign-in** with Firebase Authentication
- **Full task CRUD**: add tasks on a separate page, edit title, description and category in a dialog, delete with confirmation
- **Status tracking**: `not started` → `started` → `completed`, changed inline from the task table
- **Categories**: `Personal` or `Work`
- **Filtering** by creation date, status, and category
- **Sortable, paginated table** powered by MUI X Data Grid, newest tasks first, with quick search, column filters and CSV export
- **Timestamps** for created, last updated, and completed (server time)
- **Responsive Material UI design** with a shared theme

## Tech Stack

| Area | Tools |
|---|---|
| Frontend | React 19, TypeScript, React Router 7, Create React App (`react-scripts` 5) |
| UI | MUI X Data Grid (with MUI / Emotion), plain CSS |
| Backend | Firebase Authentication (Google provider), Cloud Firestore |
| State | React hooks, [`react-firebase-hooks`](https://github.com/CSFrequency/react-firebase-hooks) |
| Hosting | Firebase Hosting |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) LTS and npm
- A [Firebase](https://console.firebase.google.com/) project
- (For deploying) the Firebase CLI: `npm install -g firebase-tools`

### 1. Clone and install

```bash
git clone https://github.com/<your-username>/task-manager.git
cd task-manager
npm install
```

### 2. Set up Firebase

1. In the Firebase console, create a project and add a **Web app**.
2. Go to **Authentication → Sign-in method** and enable **Google**.
3. Go to **Firestore Database** and create a database.
4. Add security rules so users can only access their own tasks, for example:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /tasks/{taskId} {
         allow read, update, delete: if request.auth != null
                                     && request.auth.uid == resource.data.userId;
         allow create: if request.auth != null
                       && request.auth.uid == request.resource.data.userId;
       }
     }
   }
   ```

### 3. Create `src/firebase/config.ts`

This file is **gitignored** and not included in the repo. You must create it yourself, or the app won't compile. Paste in your web app config from **Project settings → General → Your apps**:

```ts
// src/firebase/config.ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: '...',
  authDomain: '...',
  projectId: '...',
  storageBucket: '...',
  messagingSenderId: '...',
  appId: '...',
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
```

### 4. Run

```bash
npm start
```

Open [http://localhost:3000](http://localhost:3000) and sign in with Google.

## Available Scripts

| Command | Description |
|---|---|
| `npm start` | Start the development server with hot reload |
| `npm run build` | Create an optimized production build in `build/` |
| `npm test` | Run tests in interactive watch mode |
| `npm run eject` | Eject from Create React App (one-way, not recommended) |

## Deployment (Firebase Hosting)

`firebase.json` serves `build/` as a single-page app, so all routes rewrite to `index.html`.

```bash
firebase login
firebase use --add      # select your own Firebase project (replaces the default in .firebaserc)
npm run build
firebase deploy --only hosting
```

Remember to add your hosting domain under **Authentication → Settings → Authorized domains** if it isn't already listed.

## Project Structure

```
src/
├── index.tsx                # MUI ThemeProvider + CssBaseline
├── theme.ts                 # MUI theme (colors, typography, defaults)
├── App.tsx                  # Auth gate + routes (/ and /add)
├── components/
│   ├── AuthWrapper.tsx      # Sign-in screen, app bar, page layout
│   ├── TaskList.tsx         # Filters, Data Grid, status updates, delete
│   ├── EditTaskModal.tsx    # Edit dialog (title, description, category)
│   └── ConfirmDialog.tsx    # Reusable confirmation dialog
├── pages/
│   ├── TaskListPage.tsx     # Route "/"
│   └── AddTaskPage.tsx      # Route "/add": create a task
├── hooks/
│   └── useTasks.ts          # Loads the user's tasks, status/delete actions
├── services/
│   └── tasks.ts             # All Firestore reads/writes for tasks
├── utils/
│   └── filterTasks.ts       # Client-side filtering and sorting
├── firebase/
│   └── config.ts            # Firebase init (you create this; gitignored)
└── types/
    └── Task.ts              # Task types, statuses, categories
```

## Data Model

Tasks are stored in the Firestore collection `tasks`:

| Field | Type | Description |
|---|---|---|
| `title` | string | Task title |
| `description` | string | Optional details |
| `status` | string | `not started` \| `started` \| `completed` |
| `category` | string | `Personal` \| `Work` |
| `userId` | string | Firebase Auth UID of the owner |
| `createdAt` | Timestamp | Creation time (server time; older tasks store epoch milliseconds) |
| `updatedAt` | Timestamp | Last time the task was edited or its status changed |
| `completedAt` | Timestamp \| null | When the task was marked completed |

Times are written with Firestore `serverTimestamp()`, so they don't depend on the user's device clock.
