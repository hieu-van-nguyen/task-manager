import { computeStats } from './stats';
import { local, makeTask } from '../testUtils';

const now = new Date(2026, 10, 18, 12); // Wed 18 Nov 2026; week started Mon 16 Nov

describe('computeStats', () => {
  const tasks = [
    makeTask({ status: 'completed', completedAt: local(2026, 11, 17), category: 'Work' }), // this week
    makeTask({ status: 'completed', completedAt: local(2026, 11, 15), category: 'Work' }), // last week
    makeTask({ status: 'started', dueDate: '2026-11-17', priority: 'high', category: 'Work' }), // overdue
    makeTask({ status: 'not started', dueDate: '2026-11-18', priority: 'high' }), // due today
    makeTask({ status: 'not started', dueDate: '2026-12-01', priority: 'low', category: 'Home' }),
    makeTask({ status: 'completed', dueDate: '2026-01-01', completedAt: local(2026, 11, 18) }), // done: not overdue
  ];
  const stats = computeStats(tasks, now);

  it('counts totals, open tasks and status breakdown', () => {
    expect(stats.total).toBe(6);
    expect(stats.open).toBe(3);
    expect(stats.byStatus).toEqual({ 'not started': 2, started: 1, completed: 3 });
  });

  it('counts completed this week, overdue and due today', () => {
    expect(stats.completedThisWeek).toBe(2);
    expect(stats.overdue).toBe(1);
    expect(stats.dueToday).toBe(1);
  });

  it('breaks down open tasks by priority and all tasks by category', () => {
    expect(stats.openByPriority).toEqual({ low: 1, medium: 0, high: 2 });
    expect(stats.byCategory).toEqual([
      { category: 'Work', total: 3, completed: 2 },
      { category: 'Personal', total: 2, completed: 1 },
      { category: 'Home', total: 1, completed: 0 },
    ]);
  });

  it('handles an empty list', () => {
    expect(computeStats([], now)).toMatchObject({ total: 0, open: 0, overdue: 0, byCategory: [] });
  });
});
