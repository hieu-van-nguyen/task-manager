import { local, makeTask } from '../testUtils';
import {
  EMPTY_FILTERS, filterAndSortTasks, getAllCategories, getLocalDayRange, hasActiveFilters, sortForBoard,
} from './filterTasks';

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

  it('filters by status, priority and category', () => {
    const tasks = [
      makeTask({ title: 'a', status: 'completed', category: 'Work', priority: 'high' }),
      makeTask({ title: 'b', status: 'completed', category: 'Personal', priority: 'low' }),
      makeTask({ title: 'c', status: 'started', category: 'Work', priority: 'high' }),
    ];
    const titles = (f: Partial<typeof EMPTY_FILTERS>) =>
      filterAndSortTasks(tasks, { ...EMPTY_FILTERS, ...f }).map(t => t.title).sort();
    expect(titles({ status: 'completed' })).toEqual(['a', 'b']);
    expect(titles({ status: 'completed', category: 'Work' })).toEqual(['a']);
    expect(titles({ priority: 'high' })).toEqual(['a', 'c']);
  });

  it('searches title, description and subtasks, case-insensitively, all words required', () => {
    const tasks = [
      makeTask({ title: 'Buy milk' }),
      makeTask({ title: 'Report', description: 'Quarterly SALES numbers' }),
      makeTask({ title: 'Trip', subtasks: [{ id: 's', title: 'Book hotel', done: false }] }),
    ];
    const search = (q: string) => filterAndSortTasks(tasks, { ...EMPTY_FILTERS, search: q }).map(t => t.title);
    expect(search('milk')).toEqual(['Buy milk']);
    expect(search('sales')).toEqual(['Report']);
    expect(search('hotel')).toEqual(['Trip']);
    expect(search('quarterly numbers')).toEqual(['Report']);
    expect(search('quarterly milk')).toEqual([]);
    expect(search('   ')).toHaveLength(3);
  });

  it('returns all tasks sorted newest first with empty filters, without mutating input', () => {
    const input = [...all];
    const result = filterAndSortTasks(input, EMPTY_FILTERS);
    expect(result.map(t => t.title)).toEqual(['next', 'late', 'early', 'before']);
    expect(input).toEqual(all);
  });
});

describe('hasActiveFilters', () => {
  it('is false only when every filter is empty', () => {
    expect(hasActiveFilters(EMPTY_FILTERS)).toBe(false);
    expect(hasActiveFilters({ ...EMPTY_FILTERS, search: 'x' })).toBe(true);
  });
});

describe('sortForBoard', () => {
  it('orders by priority, then soonest due date (none last), then newest', () => {
    const tasks = [
      makeTask({ title: 'low', priority: 'low' }),
      makeTask({ title: 'high-nodue', priority: 'high', dueDate: null }),
      makeTask({ title: 'high-later', priority: 'high', dueDate: '2026-12-01' }),
      makeTask({ title: 'high-soon', priority: 'high', dueDate: '2026-11-20' }),
      makeTask({ title: 'med-old', createdAt: 1 }),
      makeTask({ title: 'med-new', createdAt: 2 }),
    ];
    expect(sortForBoard(tasks).map(t => t.title)).toEqual([
      'high-soon', 'high-later', 'high-nodue', 'med-new', 'med-old', 'low',
    ]);
  });
});

describe('getAllCategories', () => {
  it('merges defaults with custom categories, sorted and unique', () => {
    const tasks = [makeTask({ category: 'Home' }), makeTask({ category: 'Work' }), makeTask({ category: 'Home' })];
    expect(getAllCategories(tasks)).toEqual(['Home', 'Personal', 'Work']);
  });
});
