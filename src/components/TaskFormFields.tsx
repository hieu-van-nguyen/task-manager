import React from 'react';
import { Autocomplete, MenuItem, Stack, TextField } from '@mui/material';
import {
  PRIORITY_LABELS, STATUS_LABELS, TASK_PRIORITIES, TASK_STATUSES, TaskFields, TaskPriority, TaskStatus,
} from '../types/Task';
import { SubtaskEditor } from './SubtaskEditor';

interface TaskFormFieldsProps {
  value: TaskFields;
  onChange: (changes: Partial<TaskFields>) => void;
  /** Category suggestions; the user can also type a new one. */
  categories: string[];
  /** Show the status field (edit dialog). New tasks always start as "not started". */
  showStatus?: boolean;
  autoFocus?: boolean;
}

/** All editable task fields. Shared by the Add Task page and the Edit dialog. */
export const TaskFormFields: React.FC<TaskFormFieldsProps> = ({
  value, onChange, categories, showStatus = false, autoFocus = false,
}) => (
  <Stack spacing={2}>
    <TextField
      label="Title"
      value={value.title}
      onChange={(e) => onChange({ title: e.target.value })}
      required
      autoFocus={autoFocus}
      fullWidth
    />
    <TextField
      label="Description (optional)"
      value={value.description}
      onChange={(e) => onChange({ description: e.target.value })}
      multiline
      minRows={3}
      fullWidth
    />
    <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
      <Autocomplete
        freeSolo
        options={categories}
        inputValue={value.category}
        onInputChange={(_, category) => onChange({ category })}
        sx={{ flex: 1, minWidth: 160 }}
        renderInput={(params) => (
          <TextField {...params} label="Category" size="small" helperText="Pick one or type a new one" />
        )}
      />
      <TextField
        select
        label="Priority"
        value={value.priority}
        onChange={(e) => onChange({ priority: e.target.value as TaskPriority })}
        sx={{ minWidth: 130 }}
      >
        {TASK_PRIORITIES.map(p => <MenuItem key={p} value={p}>{PRIORITY_LABELS[p]}</MenuItem>)}
      </TextField>
      <TextField
        label="Due date"
        type="date"
        value={value.dueDate ?? ''}
        onChange={(e) => onChange({ dueDate: e.target.value || null })}
        slotProps={{ inputLabel: { shrink: true } }}
        sx={{ minWidth: 160 }}
      />
      {showStatus && (
        <TextField
          select
          label="Status"
          value={value.status}
          onChange={(e) => onChange({ status: e.target.value as TaskStatus })}
          sx={{ minWidth: 150 }}
        >
          {TASK_STATUSES.map(s => <MenuItem key={s} value={s}>{STATUS_LABELS[s]}</MenuItem>)}
        </TextField>
      )}
    </Stack>
    <SubtaskEditor subtasks={value.subtasks} onChange={(subtasks) => onChange({ subtasks })} />
  </Stack>
);
