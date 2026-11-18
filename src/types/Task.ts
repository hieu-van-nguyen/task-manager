export const TASK_STATUSES = ['not started', 'started', 'completed'] as const;
export type TaskStatus = (typeof TASK_STATUSES)[number];

export const TASK_CATEGORIES = ['Personal', 'Work'] as const;
export type TaskCategory = (typeof TASK_CATEGORIES)[number];

export const STATUS_LABELS: Record<TaskStatus, string> = {
  'not started': 'Not Started',
  started: 'Started',
  completed: 'Completed',
};

/**
 * A task as used by the UI. All times are epoch milliseconds, whatever their
 * storage format in Firestore (see `src/services/tasks.ts`).
 */
export interface Task {
  id: string; // The Firestore document ID
  title: string;
  description: string;
  status: TaskStatus;
  category: TaskCategory;
  userId: string; // To ensure users only see their tasks
  createdAt: number;
  /** Last edit (title/description/category/status). Null for tasks never edited since this field was added. */
  updatedAt: number | null;
  /** When status became 'completed'; null when not completed. */
  completedAt: number | null;
}

/** Fields the user supplies when creating a task. */
export type NewTask = Pick<Task, 'title' | 'description' | 'category'>;

/** Fields the user can edit on an existing task. */
export type TaskEdits = Partial<Pick<Task, 'title' | 'description' | 'category'>>;
