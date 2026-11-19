import { Task } from './types/Task';

let counter = 0;

/** Builds a complete Task for tests; override only what the test cares about. */
export const makeTask = (overrides: Partial<Task> = {}): Task => ({
  id: `task-${++counter}`,
  title: 'Task',
  description: '',
  status: 'not started',
  priority: 'medium',
  category: 'Personal',
  dueDate: null,
  subtasks: [],
  userId: 'user-1',
  createdAt: Date.now(),
  updatedAt: null,
  completedAt: null,
  ...overrides,
});

/** Local-time epoch ms, so tests pass in any timezone. */
export const local = (y: number, m: number, d: number, h = 0, min = 0) =>
  new Date(y, m - 1, d, h, min).getTime();
