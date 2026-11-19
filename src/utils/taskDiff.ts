import { Task, TaskEdits, TaskFields } from '../types/Task';

const FIELDS: (keyof TaskFields)[] = [
  'title', 'description', 'status', 'priority', 'category', 'dueDate', 'subtasks',
];

const normalize = (key: keyof TaskFields, value: unknown) =>
  typeof value === 'string' && key !== 'dueDate' ? value.trim() : value;

export const pickFields = (task: Task): TaskFields => ({
  title: task.title,
  description: task.description,
  status: task.status,
  priority: task.priority,
  category: task.category,
  dueDate: task.dueDate,
  subtasks: task.subtasks,
});

/**
 * Returns only the fields that changed. Important for `status`: sending it
 * (even unchanged) would reset `completedAt`.
 */
export const getChangedFields = (original: TaskFields, next: TaskFields): TaskEdits => {
  const changes: Record<string, unknown> = {};
  for (const key of FIELDS) {
    const a = normalize(key, original[key]);
    const b = normalize(key, next[key]);
    if (JSON.stringify(a) !== JSON.stringify(b)) changes[key] = next[key];
  }
  return changes as TaskEdits;
};
