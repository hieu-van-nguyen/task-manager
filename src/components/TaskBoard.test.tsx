import React from 'react';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { TaskBoard } from './TaskBoard';
import { makeTask } from '../testUtils';

jest.mock('../firebase/config', () => ({ db: {} }));

const tasks = [
  makeTask({ id: 't1', title: 'Plan trip', status: 'not started' }),
  makeTask({ id: 't2', title: 'Write report', status: 'started' }),
];

const setup = () => {
  const handlers = { onEdit: jest.fn(), onDelete: jest.fn(), onStatusChange: jest.fn() };
  render(<TaskBoard tasks={tasks} {...handlers} />);
  return handlers;
};

test('renders one column per status with its tasks', () => {
  setup();
  const notStarted = screen.getByRole('region', { name: 'Not Started column' });
  const started = screen.getByRole('region', { name: 'Started column' });
  const completed = screen.getByRole('region', { name: 'Completed column' });
  expect(within(notStarted).getByText('Plan trip')).toBeInTheDocument();
  expect(within(started).getByText('Write report')).toBeInTheDocument();
  expect(within(completed).getByText('Drop tasks here')).toBeInTheDocument();
});

test('arrow buttons move a task to the adjacent status', () => {
  const { onStatusChange } = setup();
  fireEvent.click(screen.getByRole('button', { name: 'Move "Write report" to Completed' }));
  expect(onStatusChange).toHaveBeenCalledWith(tasks[1], 'completed');
  fireEvent.click(screen.getByRole('button', { name: 'Move "Write report" to Not Started' }));
  expect(onStatusChange).toHaveBeenCalledWith(tasks[1], 'not started');
});

test('dropping a dragged card on another column changes its status', () => {
  const { onStatusChange } = setup();
  const data = new Map<string, string>();
  const dataTransfer = {
    setData: (k: string, v: string) => data.set(k, v),
    getData: (k: string) => data.get(k) ?? '',
    get types() { return Array.from(data.keys()); },
    effectAllowed: '',
    dropEffect: '',
  };
  const card = screen.getByText('Plan trip').closest('[draggable="true"]')!;
  fireEvent.dragStart(card, { dataTransfer });
  const completed = screen.getByRole('region', { name: 'Completed column' });
  fireEvent.dragOver(completed, { dataTransfer });
  fireEvent.drop(completed, { dataTransfer });
  expect(onStatusChange).toHaveBeenCalledWith(tasks[0], 'completed');
});
