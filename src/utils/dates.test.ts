import { getDueState, isDateString, parseLocalDate, startOfWeek, toLocalDateString } from './dates';
import { local } from '../testUtils';

const now = new Date(2026, 10, 18, 15, 30); // Wed 18 Nov 2026, 15:30 local

describe('toLocalDateString / parseLocalDate', () => {
  it('round-trips in local time', () => {
    expect(toLocalDateString(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
    expect(parseLocalDate('2026-01-05').getTime()).toBe(local(2026, 1, 5));
  });

  it('validates the YYYY-MM-DD format', () => {
    expect(isDateString('2026-11-18')).toBe(true);
    expect(isDateString('18/11/2026')).toBe(false);
    expect(isDateString(null)).toBe(false);
  });
});

describe('getDueState', () => {
  it('classifies by local calendar day', () => {
    expect(getDueState({ dueDate: '2026-11-17', status: 'started' }, now)).toBe('overdue');
    expect(getDueState({ dueDate: '2026-11-18', status: 'started' }, now)).toBe('today');
    expect(getDueState({ dueDate: '2026-11-19', status: 'not started' }, now)).toBe('upcoming');
  });

  it('never flags completed tasks or tasks without a due date', () => {
    expect(getDueState({ dueDate: '2020-01-01', status: 'completed' }, now)).toBe('none');
    expect(getDueState({ dueDate: null, status: 'started' }, now)).toBe('none');
  });
});

describe('startOfWeek', () => {
  it('returns Monday 00:00 local', () => {
    expect(startOfWeek(now)).toBe(local(2026, 11, 16));
    expect(startOfWeek(new Date(2026, 10, 22, 12))).toBe(local(2026, 11, 16)); // Sunday
    expect(startOfWeek(new Date(2026, 10, 16, 0, 0))).toBe(local(2026, 11, 16)); // Monday midnight
  });
});
