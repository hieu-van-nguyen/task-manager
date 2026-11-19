export const TASK_STATUSES = ['not started', 'started', 'completed'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  'not started': 'Not Started',
  started: 'Started',
  completed: 'Completed',
};

export const TASK_PRIORITIES = ['low', 'medium', 'high'] as const;
export type TaskPriority = (typeof TASK_PRIORITIES)[number];

export const PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
};

/** Higher = more important. Used for sorting. */
export const PRIORITY_RANK: Record<TaskPriority, number> = { low: 0, medium: 1, high: 2 };

/**
 * Categories are free-form strings chosen by the user. These are always offered,
 * alongside any category already used on one of the user's tasks.
 */
export const DEFAULT_CATEGORIES = ['Personal', 'Work'] as const;
export const FALLBACK_CATEGORY = 'Personal';

export interface Subtask {
  id: string;
  title: string;
  done: boolean;
}

/**
 * A task as used by the UI. All times are epoch milliseconds, whatever their
 * storage format in Firestore (see `src/services/tasks.ts`).
 */
export interface Task {
  id: string; // The Firestore document ID
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  category: string;
  /** Local calendar date "YYYY-MM-DD" (no time / timezone), or null. */
  dueDate: string | null;
  subtasks: Subtask[];
  userId: string; // To ensure users only see their tasks
  createdAt: number;
  /** Last edit. Null for tasks never edited since this field was added. */
  updatedAt: number | null;
  /** When status became 'completed'; null when not completed. */
  completedAt: number | null;
}

/** The user-editable fields of a task. */
export type TaskFields = Pick<
  Task,
  'title' | 'description' | 'status' | 'priority' | 'category' | 'dueDate' | 'subtasks'
>;

/** Fields the user supplies when creating a task. */
export type NewTask = TaskFields;

/** Fields the user can edit on an existing task. */
export type TaskEdits = Partial<TaskFields>;

export const EMPTY_TASK_FIELDS: TaskFields = {
  title: '',
  description: '',
  status: 'not started',
  priority: 'medium',
  category: FALLBACK_CATEGORY,
  dueDate: null,
  subtasks: [],
};
