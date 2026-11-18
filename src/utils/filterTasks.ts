import { Task } from '../types/Task';

export interface TaskFilters {
  /** Date string from an <input type="date">, e.g. "2026-11-14". Empty = no filter. */
  date: string;
  /** TaskStatus value. Empty = no filter. */
  status: string;
  /** Category value. Empty = no filter. */
  category: string;
}

export const EMPTY_FILTERS: TaskFilters = { date: '', status: '', category: '' };

/**
 * Returns [start, end) epoch-ms bounds for a "YYYY-MM-DD" string in the user's
 * LOCAL timezone. (`new Date("YYYY-MM-DD")` would parse as UTC midnight, which
 * shifts the day for anyone not in UTC.)
 */
export const getLocalDayRange = (dateString: string): [number, number] => {
  const [year, month, day] = dateString.split('-').map(Number);
  const start = new Date(year, month - 1, day);
  const end = new Date(year, month - 1, day + 1);
  return [start.getTime(), end.getTime()];
};

/** Applies the filters and sorts newest first. Does not mutate the input. */
export const filterAndSortTasks = (tasks: Task[], filters: TaskFilters): Task[] => {
  let result = tasks;

  if (filters.date) {
    const [start, end] = getLocalDayRange(filters.date);
    result = result.filter(t => t.createdAt >= start && t.createdAt < end);
  }
  if (filters.status) {
    result = result.filter(t => t.status === filters.status);
  }
  if (filters.category) {
    result = result.filter(t => t.category === filters.category);
  }

  return [...result].sort((a, b) => b.createdAt - a.createdAt);
};
