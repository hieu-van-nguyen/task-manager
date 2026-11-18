import { toMillis, toTask } from './tasks';

jest.mock('../firebase/config', () => ({ db: {} }));

const fakeTimestamp = (ms: number) => ({ toMillis: () => ms });

describe('toMillis', () => {
  it('passes through epoch-ms numbers (legacy documents)', () => {
    expect(toMillis(1700000000000)).toBe(1700000000000);
  });

  it('converts Firestore Timestamps', () => {
    expect(toMillis(fakeTimestamp(1700000000123))).toBe(1700000000123);
  });

  it('returns null for missing values or pending server timestamps', () => {
    expect(toMillis(undefined)).toBeNull();
    expect(toMillis(null)).toBeNull();
  });
});

describe('toTask', () => {
  it('maps a new-style document with Timestamps', () => {
    const task = toTask('abc', {
      title: 'Write report',
      description: 'Q4',
      status: 'completed',
      category: 'Work',
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
      category: 'Work',
      userId: 'u1',
      createdAt: 1000,
      updatedAt: 2000,
      completedAt: 3000,
    });
  });

  it('fills defaults for legacy documents', () => {
    const task = toTask('old', {
      title: 'Old task',
      status: 'started',
      category: '',
      userId: 'u1',
      createdAt: 1234,
    });
    expect(task.description).toBe('');
    expect(task.category).toBe('Personal');
    expect(task.createdAt).toBe(1234);
    expect(task.updatedAt).toBeNull();
    expect(task.completedAt).toBeNull();
  });

  it('falls back to safe values for unknown status/category', () => {
    const task = toTask('x', { title: 't', status: 'bogus', category: 'Other', userId: 'u1', createdAt: 1 });
    expect(task.status).toBe('not started');
    expect(task.category).toBe('Personal');
  });
});
