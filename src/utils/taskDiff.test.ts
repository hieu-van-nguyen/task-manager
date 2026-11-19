import { getChangedFields, pickFields } from './taskDiff';
import { makeTask } from '../testUtils';

const original = pickFields(makeTask({
  title: 'Write report',
  status: 'completed',
  subtasks: [{ id: 'a', title: 'Draft', done: true }],
}));

describe('getChangedFields', () => {
  it('returns nothing when nothing changed (ignoring surrounding whitespace)', () => {
    expect(getChangedFields(original, { ...original, title: '  Write report ' })).toEqual({});
  });

  it('omits an unchanged status so completedAt is preserved', () => {
    const changes = getChangedFields(original, { ...original, priority: 'high' });
    expect(changes).toEqual({ priority: 'high' });
    expect(changes).not.toHaveProperty('status');
  });

  it('detects changes in nested subtasks and nullable due date', () => {
    const next = {
      ...original,
      dueDate: '2026-12-01',
      subtasks: [{ id: 'a', title: 'Draft', done: false }],
    };
    expect(getChangedFields(original, next)).toEqual({
      dueDate: '2026-12-01',
      subtasks: [{ id: 'a', title: 'Draft', done: false }],
    });
  });
});
