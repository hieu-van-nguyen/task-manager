# Task Manager

A personal task manager built with **React 19**, **TypeScript**, and **Firebase**. Sign in with Google, then create, organize, filter, and track your own tasks. Each user only sees their own tasks.

## Features

- **Google sign-in** with Firebase Authentication
- **Rich tasks**: title, description, category, priority (low / medium / high), due date and a subtask checklist
- **Three views**:
  - **Table** (MUI X Data Grid): sorting, column filters, CSV export, inline status changes, and **bulk actions** (select several tasks, then mark them completed / started or delete them)
  - **Board**: a Kanban board with Not Started / Started / Completed columns and drag-and-drop between them
  - **Dashboard**: open, due today, overdue and completed-this-week counts, plus breakdowns by status, priority and category
- **Due dates** with overdue (red) and due-today (amber) highlighting
- **Search** across titles, descriptions and subtasks, plus filters for created date, status, priority and category
- **Custom categories**: pick an existing one or type a new one
- **Real-time sync**: changes appear instantly across tabs and devices (Firestore listeners)
- **Works offline and installs as an app**: tasks load and can be edited offline and sync when you reconnect
- **Light and dark mode**, remembered per browser
- **Timestamps** for created, last updated, and completed (server time)
- **Responsive Material UI design**

## Tech Stack

| Area | Tools |
|---|---|
| Frontend | React 19, TypeScript, React Router 7, Create React App (`react-scripts` 5) |
| UI | Material UI 7 (light/dark theme), MUI X Data Grid, MUI Icons |
| Backend | Firebase Authentication (Google provider), Cloud Firestore |
| State | React hooks, [`react-firebase-hooks`](https://github.com/CSFrequency/react-firebase-hooks) |
| Offline | Firestore persistent cache, service worker, web app manifest |
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
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore';

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
// Persistent cache enables offline use (shared across tabs)
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});
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

The production build includes a service worker (`public/service-worker.js`) that caches the app shell for offline use and lets browsers offer **Install app**. It is not active under `npm start`.

Remember to add your hosting domain under **Authentication → Settings → Authorized domains** if it isn't already listed.

## Project Structure

```
src/
├── index.tsx                  # Theme provider, service worker registration
├── theme.ts                   # MUI light + dark color schemes
├── App.tsx                    # Auth gate + routes (/ and /add)
├── components/
│   ├── AuthWrapper.tsx        # Sign-in screen, app bar, page layout
│   ├── ColorModeToggle.tsx    # Light/dark switch
│   ├── TaskList.tsx           # Filters, view switch, dialogs
│   ├── TaskTable.tsx          # Data Grid view + bulk actions
│   ├── TaskBoard.tsx          # Kanban view with drag and drop
│   ├── TaskDashboard.tsx      # Stats view
│   ├── TaskFormFields.tsx     # Shared create/edit form fields
│   ├── SubtaskEditor.tsx      # Checklist editor
│   ├── TaskBadges.tsx         # Priority / due date / subtask chips
│   ├── EditTaskModal.tsx      # Edit dialog
│   └── ConfirmDialog.tsx      # Reusable confirmation dialog
├── pages/
│   ├── TaskListPage.tsx       # Route "/"
│   └── AddTaskPage.tsx        # Route "/add": create a task
├── hooks/
│   └── useTasks.ts            # Live task list + actions
├── services/
│   └── tasks.ts               # All Firestore reads/writes for tasks
├── utils/
│   ├── filterTasks.ts         # Search, filters, sorting, categories
│   ├── dates.ts               # Local-date helpers, due state
│   ├── stats.ts               # Dashboard statistics
│   └── taskDiff.ts            # Detects changed fields when editing
├── firebase/
│   └── config.ts              # Firebase init (you create this; gitignored)
└── types/
    └── Task.ts                # Task types, statuses, priorities
public/
├── manifest.json              # Installable app metadata
└── service-worker.js          # Offline app shell cache
```

## Data Model

Tasks are stored in the Firestore collection `tasks`:

| Field | Type | Description |
|---|---|---|
| `title` | string | Task title |
| `description` | string | Optional details |
| `status` | string | `not started` \| `started` \| `completed` |
| `priority` | string | `low` \| `medium` \| `high` |
| `category` | string | Any category name (defaults: `Personal`, `Work`) |
| `dueDate` | string \| null | Due date as `YYYY-MM-DD` (local calendar date) |
| `subtasks` | array | Checklist items: `{ id, title, done }` |
| `userId` | string | Firebase Auth UID of the owner |
| `createdAt` | Timestamp | Creation time (server time; older tasks store epoch milliseconds) |
| `updatedAt` | Timestamp | Last time the task was edited or its status changed |
| `completedAt` | Timestamp \| null | When the task was marked completed |

Times are written with Firestore `serverTimestamp()`, so they don't depend on the user's device clock. Older tasks without the newer fields are read with sensible defaults (medium priority, no due date, no subtasks).
