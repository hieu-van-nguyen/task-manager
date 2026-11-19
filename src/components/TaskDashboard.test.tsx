import React from 'react';
import { render, screen } from '@testing-library/react';
import { TaskDashboard } from './TaskDashboard';
import { makeTask } from '../testUtils';
import { toLocalDateString } from '../utils/dates';

test('shows an empty state without tasks', () => {
  render(<TaskDashboard tasks={[]} />);
  expect(screen.getByText(/no tasks yet/i)).toBeInTheDocument();
});

test('shows headline numbers and category breakdown', () => {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  render(
    <TaskDashboard
      tasks={[
        makeTask({ dueDate: toLocalDateString(yesterday), category: 'Work' }),
        makeTask({ status: 'completed', completedAt: Date.now(), category: 'Work' }),
      ]}
    />
  );
  expect(screen.getByText('Overdue').nextSibling).toHaveTextContent('1');
  expect(screen.getByText('Completed this week').nextSibling).toHaveTextContent('1');
  expect(screen.getByText('Open tasks').nextSibling).toHaveTextContent('1');
  expect(screen.getByRole('progressbar', { name: 'Work: 1/2' })).toBeInTheDocument();
});
