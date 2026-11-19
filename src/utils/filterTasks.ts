import { DEFAULT_CATEGORIES, PRIORITY_RANK, Task, TaskPriority, TaskStatus } from '../types/Task';
import { getLocalDayRange } from './dates';

export { getLocalDayRange } from './dates';

export interface TaskFilters {
  /** Free-text search over title, description and subtasks. Empty = no filter. */
  search: string;
  /** Created-on date "YYYY-MM-DD". Empty = no filter. */
  date: string;
  status: TaskStatus | '';
  priority: TaskPriority | '';
  category: string;
}

export const EMPTY_FILTERS: TaskFilters = { search: '', date: '', status: '', priority: '', category: '' };

export const hasActiveFilters = (filters: TaskFilters) =>
  Object.values(filters).some(v => v !== '');

const matchesSearch = (task: Task, term: string) => {
  const haystack = [task.title, task.description, ...task.subtasks.map(s => s.title)]
    .join('\n')
    .toLowerCase();
  // Every word must appear somewhere (AND search).
  return term.toLowerCase().split(/\s+/).filter(Boolean).every(word => haystack.includes(word));
};

/** Applies the filters and sorts newest first. Does not mutate the input. */
export const filterAndSortTasks = (tasks: Task[], filters: TaskFilters): Task[] => {
  let result = tasks;

  if (filters.search.trim()) {
    result = result.filter(t => matchesSearch(t, filters.search));
  }
  if (filters.date) {
    const [start, end] = getLocalDayRange(filters.date);
    result = result.filter(t => t.createdAt >= start && t.createdAt < end);
  }
  if (filters.status) {
    result = result.filter(t => t.status === filters.status);
  }
  if (filters.priority) {
    result = result.filter(t => t.priority === filters.priority);
  }
  if (filters.category) {
    result = result.filter(t => t.category === filters.category);
  }

  return [...result].sort((a, b) => b.createdAt - a.createdAt);
};

/**
 * Order within a Kanban column: high priority first, then soonest due date
 * (no due date last), then newest.
 */
export const sortForBoard = (tasks: Task[]): Task[] =>
  [...tasks].sort(
    (a, b) =>
      PRIORITY_RANK[b.priority] - PRIORITY_RANK[a.priority] ||
      (a.dueDate ?? '9999-99-99').localeCompare(b.dueDate ?? '9999-99-99') ||
      b.createdAt - a.createdAt
  );

/** Default categories plus every category used on a task, sorted, without duplicates. */
export const getAllCategories = (tasks: Task[]): string[] => {
  const set = new Set<string>(DEFAULT_CATEGORIES);
  tasks.forEach(t => t.category && set.add(t.category));
  return Array.from(set).sort((a, b) => a.localeCompare(b));
};
