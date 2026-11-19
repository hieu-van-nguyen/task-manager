import React from 'react';
import { Chip, ChipProps, Tooltip } from '@mui/material';
import EventIcon from '@mui/icons-material/Event';
import FlagIcon from '@mui/icons-material/Flag';
import ChecklistIcon from '@mui/icons-material/Checklist';
import { PRIORITY_LABELS, Subtask, Task, TaskPriority } from '../types/Task';
import { getDueState, parseLocalDate } from '../utils/dates';

const PRIORITY_COLORS: Record<TaskPriority, ChipProps['color']> = {
  low: 'default',
  medium: 'info',
  high: 'error',
};

export const PriorityChip: React.FC<{ priority: TaskPriority }> = ({ priority }) => (
  <Chip
    size="small"
    variant={priority === 'high' ? 'filled' : 'outlined'}
    color={PRIORITY_COLORS[priority]}
    icon={<FlagIcon />}
    label={PRIORITY_LABELS[priority]}
  />
);

export const formatDueDate = (dueDate: string) =>
  parseLocalDate(dueDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

/** Due date chip: red when overdue, amber when due today. Renders nothing without a due date. */
export const DueDateChip: React.FC<{ task: Pick<Task, 'dueDate' | 'status'> }> = ({ task }) => {
  if (!task.dueDate) return null;
  const state = getDueState(task);
  const color: ChipProps['color'] = state === 'overdue' ? 'error' : state === 'today' ? 'warning' : 'default';
  const prefix = state === 'overdue' ? 'Overdue · ' : state === 'today' ? 'Today · ' : '';
  return (
    <Chip
      size="small"
      variant={state === 'overdue' || state === 'today' ? 'filled' : 'outlined'}
      color={color}
      icon={<EventIcon />}
      label={`${prefix}${formatDueDate(task.dueDate)}`}
    />
  );
};

/** "2/5" subtask progress. Renders nothing when there are no subtasks. */
export const SubtaskProgress: React.FC<{ subtasks: Subtask[] }> = ({ subtasks }) => {
  if (subtasks.length === 0) return null;
  const done = subtasks.filter(s => s.done).length;
  return (
    <Tooltip title={`${done} of ${subtasks.length} subtasks done`}>
      <Chip
        size="small"
        variant="outlined"
        color={done === subtasks.length ? 'success' : 'default'}
        icon={<ChecklistIcon />}
        label={`${done}/${subtasks.length}`}
      />
    </Tooltip>
  );
};
