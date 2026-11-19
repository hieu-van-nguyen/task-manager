import { sanitizeSubtasks, toFirestoreChanges, toMillis, toTask } from './tasks';

jest.mock('../firebase/config', () => ({ db: {} }));
jest.mock('firebase/firestore', () => ({
  ...jest.requireActual('firebase/firestore'),
  serverTimestamp: () => 'SERVER_TS',
}));

const fakeTimestamp = (ms: number) => ({ toMillis: () => ms });

describe('toMillis', () => {
  it('passes through epoch-ms numbers (legacy documents)', () => {
    expect(toMillis(1700000000000)).toBe(1700000000000);
  });

  it('converts Firestore Timestamps', () => {
    expect(toMillis(fakeTimestamp(1700000000123))).toBe(1700000000123);
  });

  it('returns null for missing values', () => {
    expect(toMillis(undefined)).toBeNull();
    expect(toMillis(null)).toBeNull();
  });
});

describe('toTask', () => {
  it('maps a full document with Timestamps', () => {
    const task = toTask('abc', {
      title: 'Write report',
      description: 'Q4',
      status: 'completed',
      priority: 'high',
      category: 'Side project',
      dueDate: '2026-12-01',
      subtasks: [{ id: 's1', title: 'Draft', done: true }],
      userId: 'u1',
      createdAt: fakeTimestamp(1000),
      updatedAt: fakeTimestamp(2000),
      completedAt: fakeTimestamp(3000),
    });
    expect(task).toEqual({
      id: 'abc',
      title: 'Write report',
      description: 'Q4',
      status: 'completed',
      priority: 'high',
      category: 'Side project',
      dueDate: '2026-12-01',
      subtasks: [{ id: 's1', title: 'Draft', done: true }],
      userId: 'u1',
      createdAt: 1000,
      updatedAt: 2000,
      completedAt: 3000,
    });
  });

  it('fills defaults for legacy documents', () => {
    const task = toTask('old', { title: 'Old task', status: 'started', category: '', userId: 'u1', createdAt: 1234 });
    expect(task).toMatchObject({
      description: '',
      category: 'Personal',
      priority: 'medium',
      dueDate: null,
      subtasks: [],
      createdAt: 1234,
      updatedAt: null,
      completedAt: null,
    });
  });

  it('falls back to safe values for invalid status, priority and due date', () => {
    const task = toTask('x', {
      title: 't', status: 'bogus', priority: 'urgent', dueDate: 'tomorrow', userId: 'u1', createdAt: 1,
    });
    expect(task.status).toBe('not started');
    expect(task.priority).toBe('medium');
    expect(task.dueDate).toBeNull();
  });
});

describe('sanitizeSubtasks', () => {
  it('drops blank or malformed entries and trims titles', () => {
    expect(sanitizeSubtasks([
      { id: 'a', title: '  Keep  ', done: 1 },
      { id: 'b', title: '   ' },
      null,
      { title: 42 },
    ])).toEqual([{ id: 'a', title: 'Keep', done: true }]);
    expect(sanitizeSubtasks('nope')).toEqual([]);
  });
});

describe('toFirestoreChanges', () => {
  it('only includes provided fields, plus updatedAt', () => {
    expect(toFirestoreChanges({ title: '  New  ', priority: 'low' })).toEqual({
      title: 'New', priority: 'low', updatedAt: 'SERVER_TS',
    });
  });

  it('sets completedAt when completing and clears it otherwise', () => {
    expect(toFirestoreChanges({ status: 'completed' })).toMatchObject({ status: 'completed', completedAt: 'SERVER_TS' });
    expect(toFirestoreChanges({ status: 'started' })).toMatchObject({ status: 'started', completedAt: null });
  });

  it('normalizes empty category and invalid due date', () => {
    expect(toFirestoreChanges({ category: '  ', dueDate: '' as unknown as null })).toMatchObject({
      category: 'Personal', dueDate: null,
    });
  });
});
