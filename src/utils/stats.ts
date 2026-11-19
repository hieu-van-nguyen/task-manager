import { Task, TASK_PRIORITIES, TASK_STATUSES, TaskPriority, TaskStatus } from '../types/Task';
import { getDueState, startOfWeek } from './dates';

export interface CategoryStats {
  category: string;
  total: number;
  completed: number;
}

export interface TaskStats {
  total: number;
  open: number;
  completedThisWeek: number;
  overdue: number;
  dueToday: number;
  byStatus: Record<TaskStatus, number>;
  /** Open (not completed) tasks per priority. */
  openByPriority: Record<TaskPriority, number>;
  /** Sorted by total, descending. */
  byCategory: CategoryStats[];
}

const zeroed = <K extends string>(keys: readonly K[]) =>
  Object.fromEntries(keys.map(k => [k, 0])) as Record<K, number>;

export const computeStats = (tasks: Task[], now: Date = new Date()): TaskStats => {
  const weekStart = startOfWeek(now);
  const byStatus = zeroed(TASK_STATUSES);
  const openByPriority = zeroed(TASK_PRIORITIES);
  const categories = new Map<string, CategoryStats>();
  let completedThisWeek = 0;
  let overdue = 0;
  let dueToday = 0;

  for (const task of tasks) {
    byStatus[task.status] += 1;
    if (task.status !== 'completed') openByPriority[task.priority] += 1;
    if (task.status === 'completed' && task.completedAt !== null && task.completedAt >= weekStart) {
      completedThisWeek += 1;
    }
    const due = getDueState(task, now);
    if (due === 'overdue') overdue += 1;
    if (due === 'today') dueToday += 1;

    const cat = categories.get(task.category) ?? { category: task.category, total: 0, completed: 0 };
    cat.total += 1;
    if (task.status === 'completed') cat.completed += 1;
    categories.set(task.category, cat);
  }

  return {
    total: tasks.length,
    open: tasks.length - byStatus.completed,
    completedThisWeek,
    overdue,
    dueToday,
    byStatus,
    openByPriority,
    byCategory: Array.from(categories.values()).sort(
      (a, b) => b.total - a.total || a.category.localeCompare(b.category)
    ),
  };
};
