// All Firestore access for the `tasks` collection lives here.
//
// Timestamps: new writes use `serverTimestamp()` (Firestore `Timestamp`), so times
// don't depend on the user's device clock. Older documents store `createdAt` as
// epoch-ms numbers. `toMillis` normalizes both, so the rest of the app only ever
// sees numbers (epoch ms).

import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  DocumentData,
  onSnapshot,
  query,
  QueryDocumentSnapshot,
  serverTimestamp,
  Unsubscribe,
  updateDoc,
  where,
} from 'firebase/firestore';
import { db } from '../firebase/config';
import { NewTask, Task, TASK_CATEGORIES, TASK_STATUSES, TaskCategory, TaskEdits, TaskStatus } from '../types/Task';

const TASKS = 'tasks';

/** Converts a Firestore Timestamp, epoch-ms number, or missing value to epoch ms (or null). */
export const toMillis = (value: unknown): number | null => {
  if (typeof value === 'number') return value;
  if (value && typeof (value as { toMillis?: unknown }).toMillis === 'function') {
    return (value as { toMillis: () => number }).toMillis();
  }
  return null;
};

const isStatus = (v: unknown): v is TaskStatus => TASK_STATUSES.includes(v as TaskStatus);
const isCategory = (v: unknown): v is TaskCategory => TASK_CATEGORIES.includes(v as TaskCategory);

/** Maps raw document data to a `Task`, tolerating legacy/missing fields. */
export const toTask = (id: string, data: DocumentData): Task => ({
  id,
  title: data.title ?? '',
  description: data.description ?? '',
  status: isStatus(data.status) ? data.status : 'not started',
  category: isCategory(data.category) ? data.category : 'Personal',
  userId: data.userId,
  createdAt: toMillis(data.createdAt) ?? 0,
  updatedAt: toMillis(data.updatedAt),
  completedAt: toMillis(data.completedAt),
});

// 'estimate': a local write's pending serverTimestamp() reads as the local time
// instead of null, so a just-created task doesn't briefly show no date.
const snapshotToTask = (snap: QueryDocumentSnapshot) =>
  toTask(snap.id, snap.data({ serverTimestamps: 'estimate' }));

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
  const ref = await addDoc(collection(db, TASKS), {
    title: task.title.trim(),
    description: task.description.trim(),
    category: task.category,
    status: 'not started' as TaskStatus,
    userId,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    completedAt: null,
  });
  return ref.id;
};

export const updateTask = async (taskId: string, edits: TaskEdits): Promise<void> => {
  const changes: DocumentData = { updatedAt: serverTimestamp() };
  if (edits.title !== undefined) changes.title = edits.title.trim();
  if (edits.description !== undefined) changes.description = edits.description.trim();
  if (edits.category !== undefined) changes.category = edits.category;
  await updateDoc(doc(db, TASKS, taskId), changes);
};

export const updateTaskStatus = async (taskId: string, status: TaskStatus): Promise<void> => {
  await updateDoc(doc(db, TASKS, taskId), {
    status,
    updatedAt: serverTimestamp(),
    completedAt: status === 'completed' ? serverTimestamp() : null,
  });
};

export const deleteTask = async (taskId: string): Promise<void> => {
  await deleteDoc(doc(db, TASKS, taskId));
};

export const getErrorMessage = (err: unknown): string =>
  err instanceof Error ? err.message : String(err);
