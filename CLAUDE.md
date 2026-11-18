# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm start`: dev server at http://localhost:3000 (Create React App / `react-scripts`)
- `npm run build`: production build into `build/`
- `npm test`: Jest + React Testing Library in watch mode (`npm test -- --watchAll=false` for a single run)
- `firebase deploy --only hosting`: deploy `build/` to Firebase Hosting (needs the Firebase CLI; project set in `.firebaserc`)

## Required local setup

`src/firebase/config.ts` is **gitignored** (`**/config.ts` in `.gitignore`) and is not in the repo. The app will not compile without it. It must export `auth` and `db`:

```ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

const app = initializeApp({ /* Firebase web app config */ });
export const auth = getAuth(app);
export const db = getFirestore(app);
```

Never commit this file. Because of the `**/config.ts` ignore rule, any other file named `config.ts` will also be ignored silently.

## Architecture

React 19 + TypeScript SPA (CRA, TypeScript 4.9 because of `react-scripts` 5) backed by Firebase Auth (Google sign-in) and Cloud Firestore. There is no custom backend.

### Flow
- `src/index.tsx` → `src/App.tsx`. `App` wraps everything in `AuthWrapper`, and mounts the React Router (`BrowserRouter`) only when a user is signed in.
- `src/components/AuthWrapper.tsx`: shows a loading or error state, a "Sign in with Google" button (`signInWithPopup`), or the welcome header with Log Out followed by `children`.
- Routes:
  - `/` → `src/pages/TaskListPage.tsx` (thin wrapper) → `src/components/TaskList.tsx`
  - `/add` → `src/pages/AddTaskPage.tsx` (create form, navigates back to `/` on success)
- `src/components/TaskList.tsx`: the main dashboard. It fetches tasks, renders filters, shows an MUI X `DataGrid`, handles inline status changes and deletes, and opens `EditTaskModal`.
- `src/components/EditTaskModal.tsx`: edits `title` and `description` only.
- `src/types/Task.ts`: `Task` interface and `TaskStatus` union.

### Data access patterns (important when changing behavior)
- Firestore is accessed directly from components with the modular SDK (`collection`, `addDoc`, `updateDoc`, `deleteDoc`, `getDocs`). There is no service layer.
- `TaskList` makes a **one-time `getDocs`** query: `where('userId', '==', uid)`. It is not a live listener, so after every mutation it calls `fetchTasks()` again. `useCollectionData` is imported but not used.
- Date, status and category filtering and the newest-first sort all run **in the browser** in `src/utils/filterTasks.ts` (a pure, unit-tested function; date filtering uses the user's local day), so changing a filter doesn't refetch and no composite Firestore indexes are needed. Adding server-side `orderBy` or more `where` clauses would require an index.
- Auth state is read with `useAuthState(auth)` from `react-firebase-hooks` in each component that needs it. There is no React context.

### Data model: Firestore collection `tasks`
| Field | Type | Notes |
|---|---|---|
| `title` | string | required |
| `description` | string | `''` on create, editable in the modal |
| `status` | `'not started' \| 'started' \| 'completed'` | new tasks start as `'not started'` |
| `createdAt` | number | **epoch milliseconds** (`Date.now()`), not a Firestore `Timestamp` |
| `userId` | string | Firebase Auth `uid` of the owner |
| `category` | `'Personal' \| 'Work'` | typed as `string`; missing or empty values are treated as `'Personal'` when read |

The document ID is mapped to `Task.id` when read and is not stored as a field.

### Styling
Mostly plain HTML elements styled with global CSS in `src/App.css` / `src/index.css` (classes such as `filter-container`, `btn-action-fixed`) plus `EditTaskModal.css`, with some inline styles. MUI is installed but only `DataGrid` is actually used.

## Testing notes
- Tests mock `./firebase/config`, `firebase/auth` and `react-firebase-hooks/auth` (see `src/App.test.tsx`), so they never touch a real Firebase project.
- CRA's Jest 27 needs two workarounds for React Router 7: a `moduleNameMapper` for `react-router/dom` in `package.json`, and a `TextEncoder`/`TextDecoder` polyfill in `src/setupTests.ts`. Keep both.

## Known gaps
- Firestore security rules are not versioned in this repo. Per-user isolation relies on the `userId` query plus whatever rules are set up in the Firebase console.
- After editing `.gitignore`, see `update_git_ignore.txt` for how to refresh the git index.
