import { Task } from '../types/Task';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

export const isDateString = (value: unknown): value is string =>
  typeof value === 'string' && DATE_RE.test(value);

/** Formats a Date as a local "YYYY-MM-DD" string (not UTC). */
export const toLocalDateString = (date: Date): string => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

/** Parses "YYYY-MM-DD" as local midnight. */
export const parseLocalDate = (value: string): Date => {
  const [y, m, d] = value.split('-').map(Number);
  return new Date(y, m - 1, d);
};

/**
 * Returns [start, end) epoch-ms bounds for a "YYYY-MM-DD" string in the user's
 * LOCAL timezone. (`new Date("YYYY-MM-DD")` would parse as UTC midnight.)
 */
export const getLocalDayRange = (value: string): [number, number] => {
  const start = parseLocalDate(value);
  const end = new Date(start.getFullYear(), start.getMonth(), start.getDate() + 1);
  return [start.getTime(), end.getTime()];
};

export type DueState = 'overdue' | 'today' | 'upcoming' | 'none';

/** Completed tasks and tasks without a due date are never overdue. */
export const getDueState = (task: Pick<Task, 'dueDate' | 'status'>, now: Date = new Date()): DueState => {
  if (!task.dueDate || task.status === 'completed') return 'none';
  const today = toLocalDateString(now);
  // "YYYY-MM-DD" strings compare correctly as plain strings.
  if (task.dueDate < today) return 'overdue';
  if (task.dueDate === today) return 'today';
  return 'upcoming';
};

/** Start of the current week (Monday 00:00 local) in epoch ms. */
export const startOfWeek = (now: Date = new Date()): number => {
  const daysSinceMonday = (now.getDay() + 6) % 7;
  return new Date(now.getFullYear(), now.getMonth(), now.getDate() - daysSinceMonday).getTime();
};
