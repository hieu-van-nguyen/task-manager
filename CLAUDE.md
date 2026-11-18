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
- `src/index.tsx` wraps `App` in MUI `ThemeProvider` (theme in `src/theme.ts`) + `CssBaseline`.
- `src/App.tsx`: `AuthWrapper` around the React Router (`BrowserRouter`); routes only render once a user is signed in.
- `src/components/AuthWrapper.tsx`: app shell. Shows auth loading, the "Sign in with Google" card (`signInWithPopup`), or the `AppBar` (welcome + Log Out) with `children` in a `Container`/`Paper`.
- Routes:
  - `/` → `src/pages/TaskListPage.tsx` (thin wrapper) → `src/components/TaskList.tsx`
  - `/add` → `src/pages/AddTaskPage.tsx` (create form, navigates back to `/` on success)
- `src/components/TaskList.tsx`: the main dashboard. Filters, MUI X `DataGrid` (built-in toolbar with quick search, column filters and CSV export; inline status `Select`; hidden-by-default Updated/Completed columns), the edit dialog and a delete `ConfirmDialog`.
- `src/components/EditTaskModal.tsx`: MUI `Dialog` for editing title, description and category.
- `src/components/ConfirmDialog.tsx`: generic confirm dialog (use instead of `window.confirm`).
- `src/types/Task.ts`: `Task`, `NewTask`, `TaskEdits`, and `TaskStatus` / `TaskCategory` unions derived from the `TASK_STATUSES` / `TASK_CATEGORIES` constants. Use the constants for dropdowns, not hard-coded strings.

### Data access patterns (important when changing behavior)
- **All Firestore access goes through `src/services/tasks.ts`** (`subscribeToUserTasks`, `createTask`, `updateTask`, `updateTaskStatus`, `deleteTask`). Components never import `firebase/firestore` directly.
- **The task list is live.** `src/hooks/useTasks.ts` subscribes with `onSnapshot` (`where('userId', '==', uid)`) and unsubscribes on sign-out or unmount. Writes from this tab, other tabs or other devices all arrive as new snapshots, so **never refetch after a mutation**: just write, and the list updates. The hook also wraps status updates and deletes, storing failures in `error`.
- Snapshots are read with `serverTimestamps: 'estimate'`, so a just-written `serverTimestamp()` shows the local time instead of `null` until the server confirms it.
- The service maps documents with `toTask`, which normalizes timestamps (see below) and falls back to safe defaults for missing or unknown fields.
- Date, status and category filtering and the newest-first sort all run **in the browser** in `src/utils/filterTasks.ts` (a pure, unit-tested function; date filtering uses the user's local day), so changing a filter doesn't refetch and no composite Firestore indexes are needed. Adding server-side `orderBy` or more `where` clauses would require an index.
- Auth state is read with `useAuthState(auth)` from `react-firebase-hooks` in each component that needs it. There is no React context.

### Data model: Firestore collection `tasks`
| Field | Type | Notes |
|---|---|---|
| `title` | string | required |
| `description` | string | `''` on create, editable in the dialog |
| `status` | `'not started' \| 'started' \| 'completed'` | new tasks start as `'not started'` |
| `category` | `'Personal' \| 'Work'` | missing or unknown values are read as `'Personal'` |
| `userId` | string | Firebase Auth `uid` of the owner |
| `createdAt` | Timestamp **or** number | new docs: `serverTimestamp()`; legacy docs: epoch-ms number |
| `updatedAt` | Timestamp \| missing | set by `serverTimestamp()` on create and on every edit/status change |
| `completedAt` | Timestamp \| null \| missing | set when status becomes `'completed'`, cleared to `null` otherwise |

`toMillis` in the service converts both storage formats, so **in the app every time is epoch ms** (`number`, or `null` when absent). Because `createdAt` holds mixed types across documents, don't add a server-side `orderBy('createdAt')` without migrating legacy docs first. The document ID is mapped to `Task.id` when read and is not stored as a field.

### Styling
MUI everywhere: use MUI components (`Button`, `TextField`, `Select`/`TextField select`, `Dialog`, `Stack`, `Alert`) and the `sx` prop, plus theme tokens from `src/theme.ts`. There are no global CSS files; don't add raw `<button>`/`<select>` elements or global element selectors, which would fight MUI styles. Use responsive `sx` values (`{ xs: ..., md: ... }`) for layout.

## Testing notes
- Tests mock `./firebase/config`, `firebase/auth` and `react-firebase-hooks/auth` (see `src/App.test.tsx`), so they never touch a real Firebase project.
- CRA's Jest 27 needs two workarounds for React Router 7: a `moduleNameMapper` for `react-router/dom` in `package.json`, and a `TextEncoder`/`TextDecoder` polyfill in `src/setupTests.ts`. Keep both.

## Known gaps
- Firestore security rules are not versioned in this repo. Per-user isolation relies on the `userId` query plus whatever rules are set up in the Firebase console.
- After editing `.gitignore`, see `update_git_ignore.txt` for how to refresh the git index.
