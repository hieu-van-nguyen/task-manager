// All Firestore access for the `tasks` collection lives here.
//
// Timestamps: new writes use `serverTimestamp()` (Firestore `Timestamp`), so times
// don't depend on the user's device clock. Older documents store `createdAt` as
// epoch-ms numbers. `toMillis` normalizes both, so the rest of the app only ever
// sees numbers (epoch ms).
//
// Offline: Firestore applies writes to its local cache immediately (and the live
// subscription shows them), but the write promise only resolves once the server
// acknowledges it. `commit` therefore doesn't wait while offline, so the UI never
// hangs on "Saving...". Queued writes sync automatically when back online.

import {
  collection,
  doc,
  DocumentData,
  onSnapshot,
  query,
  QueryDocumentSnapshot,
  serverTimestamp,
  setDoc,
  Unsubscribe,
  updateDoc,
  deleteDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import {
  FALLBACK_CATEGORY,
  NewTask,
  Subtask,
  Task,
  TASK_PRIORITIES,
  TASK_STATUSES,
  TaskEdits,
  TaskPriority,
  TaskStatus,
} from '../types/Task';
import { isDateString } from '../utils/dates';

const TASKS = 'tasks';
/** Firestore's limit on operations per batch. */
const BATCH_LIMIT = 500;

/** Converts a Firestore Timestamp, epoch-ms number, or missing value to epoch ms (or null). */
export const toMillis = (value: unknown): number | null => {
  if (typeof value === 'number') return value;
  if (value && typeof (value as { toMillis?: unknown }).toMillis === 'function') {
    return (value as { toMillis: () => number }).toMillis();
  }
  return null;
};

const isStatus = (v: unknown): v is TaskStatus => TASK_STATUSES.includes(v as TaskStatus);
const isPriority = (v: unknown): v is TaskPriority => TASK_PRIORITIES.includes(v as TaskPriority);

export const newSubtaskId = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

/** Keeps only well-formed subtasks with a non-empty title. */
export const sanitizeSubtasks = (value: unknown): Subtask[] =>
  Array.isArray(value)
    ? value
        .filter(s => s && typeof s.title === 'string' && s.title.trim())
        .map(s => ({
          id: typeof s.id === 'string' && s.id ? s.id : newSubtaskId(),
          title: String(s.title).trim(),
          done: Boolean(s.done),
        }))
    : [];

const cleanCategory = (value: unknown) =>
  typeof value === 'string' && value.trim() ? value.trim() : FALLBACK_CATEGORY;

/** Maps raw document data to a `Task`, tolerating legacy/missing fields. */
export const toTask = (id: string, data: DocumentData): Task => ({
  id,
  title: data.title ?? '',
  description: data.description ?? '',
  status: isStatus(data.status) ? data.status : 'not started',
  priority: isPriority(data.priority) ? data.priority : 'medium',
  category: cleanCategory(data.category),
  dueDate: isDateString(data.dueDate) ? data.dueDate : null,
  subtasks: sanitizeSubtasks(data.subtasks),
  userId: data.userId,
  createdAt: toMillis(data.createdAt) ?? 0,
  updatedAt: toMillis(data.updatedAt),
  completedAt: toMillis(data.completedAt),
});

// 'estimate': a local write's pending serverTimestamp() reads as the local time
// instead of null, so a just-created task doesn't briefly show no date.
const snapshotToTask = (snap: QueryDocumentSnapshot) =>
  toTask(snap.id, snap.data({ serverTimestamps: 'estimate' }));

/** Waits for the server while online; resolves immediately while offline (see top of file). */
const commit = (write: Promise<unknown>): Promise<void> => {
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    write.catch(err => console.error('Queued offline write failed:', err));
    return Promise.resolve();
  }
  return write.then(() => undefined);
};

/** Converts user edits to a Firestore update, trimming and validating values. */
export const toFirestoreChanges = (edits: TaskEdits): DocumentData => {
  const changes: DocumentData = { updatedAt: serverTimestamp() };
  if (edits.title !== undefined) changes.title = edits.title.trim();
  if (edits.description !== undefined) changes.description = edits.description.trim();
  if (edits.category !== undefined) changes.category = cleanCategory(edits.category);
  if (edits.priority !== undefined) changes.priority = edits.priority;
  if (edits.dueDate !== undefined) changes.dueDate = isDateString(edits.dueDate) ? edits.dueDate : null;
  if (edits.subtasks !== undefined) changes.subtasks = sanitizeSubtasks(edits.subtasks);
  if (edits.status !== undefined) {
    changes.status = edits.status;
    changes.completedAt = edits.status === 'completed' ? serverTimestamp() : null;
  }
  return changes;
};

/**
 * Subscribes to the user's tasks. `onChange` fires immediately with the current
 * list, then again on every change from this tab, other tabs, or other devices.
 * Returns the unsubscribe function.
 */
export const subscribeToUserTasks = (
  userId: string,
  onChange: (tasks: Task[]) => void,
  onError: (error: Error) => void
): Unsubscribe => {
  const q = query(collection(db, TASKS), where('userId', '==', userId));
  return onSnapshot(q, snapshot => onChange(snapshot.docs.map(snapshotToTask)), onError);
};

export const createTask = async (userId: string, task: NewTask): Promise<string> => {
  const ref = doc(collection(db, TASKS)); // ID is generated locally, so it works offline
  await commit(setDoc(ref, {
    ...toFirestoreChanges({ ...task, status: undefined }),
    status: task.status,
    completedAt: task.status === 'completed' ? serverTimestamp() : null,
    userId,
    createdAt: serverTimestamp(),
  }));
  return ref.id;
};

/**
 * Updates a task. Only pass fields that actually changed: including `status`
 * (even unchanged) resets `completedAt`.
 */
export const updateTask = (taskId: string, edits: TaskEdits): Promise<void> =>
  commit(updateDoc(doc(db, TASKS, taskId), toFirestoreChanges(edits)));

export const updateTaskStatus = (taskId: string, status: TaskStatus): Promise<void> =>
  updateTask(taskId, { status });

export const deleteTask = (taskId: string): Promise<void> =>
  commit(deleteDoc(doc(db, TASKS, taskId)));

/** Runs `apply` for every id in atomic batches of up to 500 writes. */
const runInBatches = async (ids: string[], apply: (batch: ReturnType<typeof writeBatch>, id: string) => void) => {
  for (let i = 0; i < ids.length; i += BATCH_LIMIT) {
    const batch = writeBatch(db);
    ids.slice(i, i + BATCH_LIMIT).forEach(id => apply(batch, id));
    await commit(batch.commit());
  }
};

export const bulkUpdateStatus = (taskIds: string[], status: TaskStatus): Promise<void> =>
  runInBatches(taskIds, (batch, id) => batch.update(doc(db, TASKS, id), toFirestoreChanges({ status })));

export const bulkDelete = (taskIds: string[]): Promise<void> =>
  runInBatches(taskIds, (batch, id) => batch.delete(doc(db, TASKS, id)));

export const getErrorMessage = (err: unknown): string =>
  err instanceof Error ? err.message : String(err);
