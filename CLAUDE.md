# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

- `npm start`: dev server at http://localhost:3000 (Create React App / `react-scripts`)
- `npm run build`: production build into `build/`. **This is the reliable type check**: plain `npx tsc --noEmit` stops at syntax errors in newer `node_modules` typings (TypeScript 4.9) and never checks `src/`.
- `npm test`: Jest + React Testing Library in watch mode (`CI=true npm test -- --watchAll=false` for a single run)
- `firebase deploy --only hosting`: deploy `build/` to Firebase Hosting (needs the Firebase CLI; project set in `.firebaserc`)

## Required local setup

`src/firebase/config.ts` is **gitignored** (`**/config.ts` in `.gitignore`) and is not in the repo. The app will not compile without it. It must export `auth` and `db`, with Firestore's persistent cache enabled (offline support depends on it):

```ts
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';

const app = initializeApp({ /* Firebase web app config */ });
export const auth = getAuth(app);
export const db = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
});
```

Never commit this file. Because of the `**/config.ts` ignore rule, any other file named `config.ts` will also be ignored silently.

## Architecture

React 19 + TypeScript SPA (CRA, TypeScript 4.9 because of `react-scripts` 5) backed by Firebase Auth (Google sign-in) and Cloud Firestore. There is no custom backend.

### Flow
- `src/index.tsx` wraps `App` in MUI `ThemeProvider` (theme in `src/theme.ts`) + `CssBaseline`, and registers the service worker (production only).
- `src/App.tsx`: `AuthWrapper` around the React Router (`BrowserRouter`); routes only render once a user is signed in.
- `src/components/AuthWrapper.tsx`: app shell. Shows auth loading, the "Sign in with Google" card (`signInWithPopup`), or the `AppBar` (welcome, `ColorModeToggle`, Log Out) with `children` in a `Container`/`Paper`.
- Routes:
  - `/` → `src/pages/TaskListPage.tsx` (thin wrapper) → `src/components/TaskList.tsx`
  - `/add` → `src/pages/AddTaskPage.tsx` (create form, navigates back to `/` on success)
- `src/components/TaskList.tsx`: container. Filter bar (search, created-on date, status, priority, category), a view switch remembered in `localStorage`, the edit dialog and a delete `ConfirmDialog` (single or bulk). The views:
  - `TaskTable.tsx`: MUI X `DataGrid` with checkbox selection, a bulk-action bar (mark completed / started / not started, delete), inline status `Select`, priority sorted by rank, and due-date row highlighting. Uses the grid's built-in toolbar (columns, filters, CSV export); its quick search is off because the filter bar's search covers it.
  - `TaskBoard.tsx`: Kanban board, one column per status. Uses HTML5 drag and drop (no library) plus arrow buttons for touch and keyboard users. Cards are ordered by `sortForBoard`.
  - `TaskDashboard.tsx`: stats from `computeStats` over **all** tasks, ignoring filters.
- `src/components/TaskFormFields.tsx`: all editable fields, shared by `AddTaskPage` and `EditTaskModal` (title, description, category, priority, due date, status in the edit dialog only, and `SubtaskEditor`).
- `src/components/TaskBadges.tsx`: `PriorityChip`, `DueDateChip` (overdue / today coloring), `SubtaskProgress`. Reuse these instead of re-implementing the visuals.
- `src/components/ConfirmDialog.tsx`: generic confirm dialog (use instead of `window.confirm`).
- `src/types/Task.ts`: `Task`, `TaskFields`, `NewTask`, `TaskEdits`, `Subtask`, and the `TaskStatus` / `TaskPriority` unions with their label and rank maps. Use the constants (`TASK_STATUSES`, `TASK_PRIORITIES`, `STATUS_LABELS`, …) for dropdowns, not hard-coded strings.

### Data access patterns (important when changing behavior)
- **All Firestore access goes through `src/services/tasks.ts`** (`subscribeToUserTasks`, `createTask`, `updateTask`, `updateTaskStatus`, `deleteTask`, `bulkUpdateStatus`, `bulkDelete`). Components never import `firebase/firestore` directly.
- **The task list is live.** `src/hooks/useTasks.ts` subscribes with `onSnapshot` (`where('userId', '==', uid)`) and unsubscribes on sign-out or unmount. Writes from this tab, other tabs or other devices all arrive as new snapshots, so **never refetch after a mutation**: just write, and the list updates.
- **Writes don't hang offline.** The service's `commit()` resolves immediately while `navigator.onLine === false`, because the write is already in the local cache and syncs later. Online, it waits for the server so errors still surface. Route new writes through `commit()`.
- **Status changes must go through `toFirestoreChanges`**, which sets or clears `completedAt`. Send `status` only when it actually changed (`getChangedFields` in `src/utils/taskDiff.ts` does this for the edit dialog); otherwise `completedAt` is reset.
- Bulk operations use `writeBatch`, in chunks of 500 (Firestore's limit).
- Snapshots are read with `serverTimestamps: 'estimate'`, so a just-written `serverTimestamp()` shows the local time instead of `null` until the server confirms it.
- `toTask` normalizes every document: timestamps, plus safe defaults for missing or invalid priority, status, due date and subtasks.
- Filtering, search and sorting run **in the browser** (`src/utils/filterTasks.ts`), so changing a filter doesn't refetch and no composite Firestore indexes are needed. Adding server-side `orderBy` or more `where` clauses would require an index.
- Auth state is read with `useAuthState(auth)` from `react-firebase-hooks` in each component that needs it. There is no React context.

### Dates
- `dueDate` is a **local calendar date string** `"YYYY-MM-DD"` with no time and no timezone. Compare these as strings, and use the helpers in `src/utils/dates.ts` (`toLocalDateString`, `parseLocalDate`, `getDueState`, `startOfWeek`). Never use `new Date("YYYY-MM-DD")`, which parses as UTC.
- Completed tasks are never overdue. The week starts on Monday.

### Data model: Firestore collection `tasks`
| Field | Type | Notes |
|---|---|---|
| `title` | string | required |
| `description` | string | optional |
| `status` | `'not started' \| 'started' \| 'completed'` | |
| `priority` | `'low' \| 'medium' \| 'high'` | missing or invalid → `'medium'` |
| `category` | string | **free-form**, chosen by the user; empty → `'Personal'`. Suggestions = `DEFAULT_CATEGORIES` plus categories already used (`getAllCategories`) |
| `dueDate` | `"YYYY-MM-DD"` \| null | local date, see above |
| `subtasks` | `{ id, title, done }[]` | stored inline on the task; blank titles are dropped on save |
| `userId` | string | Firebase Auth `uid` of the owner |
| `createdAt` | Timestamp **or** number | new docs: `serverTimestamp()`; legacy docs: epoch-ms number |
| `updatedAt` | Timestamp \| missing | `serverTimestamp()` on create and every edit |
| `completedAt` | Timestamp \| null \| missing | set when status becomes `'completed'`, cleared to `null` otherwise |

`toMillis` converts both timestamp formats, so **in the app every time is epoch ms** (`number`, or `null` when absent). Because `createdAt` holds mixed types across documents, don't add a server-side `orderBy('createdAt')` without migrating legacy docs first. The document ID is mapped to `Task.id` when read and is not stored as a field.

### Styling and theme
- MUI everywhere: use MUI components and the `sx` prop. There are no global CSS files; don't add raw `<button>`/`<select>` elements or global element selectors. Use responsive `sx` values (`{ xs: ..., md: ... }`) for layout. Icons come from `@mui/icons-material`.
- **Light and dark mode**: `src/theme.ts` defines both `colorSchemes` (CSS variables, class selector). `ColorModeToggle` uses `useColorScheme()`, and MUI persists the choice. Use theme tokens (`background.paper`, `action.hover`, `text.secondary`, `error.main`, …), never fixed hex colors or `grey.50`, so both modes work.

### Offline and installable app
- Firestore's persistent IndexedDB cache (in `config.ts`) provides offline data and queued writes.
- `public/service-worker.js` (hand-written, no Workbox) caches the app shell: navigations are network-first with an `index.html` fallback, same-origin assets are stale-while-revalidate, and other origins are never intercepted. It is registered only in production builds (`src/serviceWorkerRegistration.ts`). **Bump `CACHE`** in the worker when its caching logic changes. `firebase.json` serves it with `Cache-Control: no-cache`.
- `public/manifest.json` makes the app installable.

## Testing notes
- Tests never touch a real Firebase project. Mock `../firebase/config` (and `firebase/auth` / `react-firebase-hooks/auth` where used). `src/hooks/useTasks.test.ts` shows how to mock the service.
- Use `makeTask()` and `local()` from `src/testUtils.ts` for fixtures. Pass a fixed `now` to date-dependent helpers (`getDueState`, `computeStats`).
- CRA's Jest 27 needs two workarounds for React Router 7: a `moduleNameMapper` for `react-router/dom` in `package.json`, and a `TextEncoder`/`TextDecoder` polyfill in `src/setupTests.ts`. Keep both.

## Known gaps
- Firestore security rules are not versioned in this repo. Per-user isolation relies on the `userId` query plus whatever rules are set up in the Firebase console (sample in README).
- Drag and drop on the board is mouse-only (HTML5 DnD). Touch users use the arrow buttons.
- After editing `.gitignore`, see `update_git_ignore.txt` for how to refresh the git index.
