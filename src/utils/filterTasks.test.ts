import { Task } from '../types/Task';
import { EMPTY_FILTERS, filterAndSortTasks, getLocalDayRange } from './filterTasks';

const makeTask = (overrides: Partial<Task>): Task => ({
  id: Math.random().toString(36),
  title: 'Task',
  description: '',
  status: 'not started',
  createdAt: Date.now(),
  userId: 'user-1',
  category: 'Personal',
  ...overrides,
});

// Local-time helper so tests pass in any timezone.
const local = (y: number, m: number, d: number, h = 0, min = 0) =>
  new Date(y, m - 1, d, h, min).getTime();

describe('getLocalDayRange', () => {
  it('returns local midnight to next local midnight', () => {
    const [start, end] = getLocalDayRange('2026-11-14');
    expect(start).toBe(local(2026, 11, 14));
    expect(end).toBe(local(2026, 11, 15));
    expect(new Date(start).getHours()).toBe(0);
    expect(new Date(start).getDate()).toBe(14);
  });

  it('handles month and year rollover', () => {
    const [start, end] = getLocalDayRange('2026-12-31');
    expect(start).toBe(local(2026, 12, 31));
    expect(end).toBe(local(2027, 1, 1));
  });
});

describe('filterAndSortTasks', () => {
  const earlyMorning = makeTask({ title: 'early', createdAt: local(2026, 11, 14, 0, 30) });
  const lateNight = makeTask({ title: 'late', createdAt: local(2026, 11, 14, 23, 59) });
  const nextMidnight = makeTask({ title: 'next', createdAt: local(2026, 11, 15, 0, 0) });
  const dayBefore = makeTask({ title: 'before', createdAt: local(2026, 11, 13, 23, 59) });
  const all = [dayBefore, earlyMorning, nextMidnight, lateNight];

  it('includes every task created on the selected local day and nothing else', () => {
    const result = filterAndSortTasks(all, { ...EMPTY_FILTERS, date: '2026-11-14' });
    expect(result.map(t => t.title)).toEqual(['late', 'early']);
  });

  it('filters by status and category', () => {
    const tasks = [
      makeTask({ title: 'a', status: 'completed', category: 'Work' }),
      makeTask({ title: 'b', status: 'completed', category: 'Personal' }),
      makeTask({ title: 'c', status: 'started', category: 'Work' }),
    ];
    expect(filterAndSortTasks(tasks, { ...EMPTY_FILTERS, status: 'completed' }).map(t => t.title).sort())
      .toEqual(['a', 'b']);
    expect(filterAndSortTasks(tasks, { date: '', status: 'completed', category: 'Work' }).map(t => t.title))
      .toEqual(['a']);
  });

  it('returns all tasks sorted newest first with empty filters, without mutating input', () => {
    const input = [...all];
    const result = filterAndSortTasks(input, EMPTY_FILTERS);
    expect(result.map(t => t.title)).toEqual(['next', 'late', 'early', 'before']);
    expect(input).toEqual(all);
  });
});
