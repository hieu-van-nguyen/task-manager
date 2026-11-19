import React, { useState } from 'react';
import {
  Box, Button, Checkbox, IconButton, InputBase, LinearProgress, Stack, TextField, Typography,
} from '@mui/material';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { Subtask } from '../types/Task';
import { newSubtaskId } from '../services/tasks';

interface SubtaskEditorProps {
  subtasks: Subtask[];
  onChange: (subtasks: Subtask[]) => void;
}

/** Checklist editor: add, tick, rename and remove subtasks. */
export const SubtaskEditor: React.FC<SubtaskEditorProps> = ({ subtasks, onChange }) => {
  const [draft, setDraft] = useState('');
  const done = subtasks.filter(s => s.done).length;

  const add = () => {
    const title = draft.trim();
    if (!title) return;
    onChange([...subtasks, { id: newSubtaskId(), title, done: false }]);
    setDraft('');
  };

  const update = (id: string, changes: Partial<Subtask>) =>
    onChange(subtasks.map(s => (s.id === id ? { ...s, ...changes } : s)));

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="baseline">
        <Typography variant="subtitle2">Subtasks</Typography>
        {subtasks.length > 0 && (
          <Typography variant="caption" color="text.secondary">{done}/{subtasks.length} done</Typography>
        )}
      </Stack>
      {subtasks.length > 0 && (
        <LinearProgress
          variant="determinate"
          value={(done / subtasks.length) * 100}
          sx={{ my: 1, borderRadius: 1 }}
          aria-label="Subtask progress"
        />
      )}
      <Stack spacing={0.5} sx={{ mb: 1 }}>
        {subtasks.map(s => (
          <Stack key={s.id} direction="row" alignItems="center" spacing={1}>
            <Checkbox
              size="small"
              checked={s.done}
              onChange={(e) => update(s.id, { done: e.target.checked })}
              inputProps={{ 'aria-label': `Mark "${s.title}" done` }}
            />
            <InputBase
              value={s.title}
              onChange={(e) => update(s.id, { title: e.target.value })}
              fullWidth
              inputProps={{ 'aria-label': 'Subtask title' }}
              sx={{ textDecoration: s.done ? 'line-through' : 'none', color: s.done ? 'text.secondary' : 'text.primary' }}
            />
            <IconButton
              size="small"
              onClick={() => onChange(subtasks.filter(x => x.id !== s.id))}
              aria-label={`Remove subtask "${s.title}"`}
            >
              <DeleteOutlineIcon fontSize="small" />
            </IconButton>
          </Stack>
        ))}
      </Stack>
      <Stack direction="row" spacing={1}>
        <TextField
          placeholder="Add a subtask"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault(); // don't submit the surrounding form
              add();
            }
          }}
          fullWidth
          slotProps={{ htmlInput: { 'aria-label': 'New subtask' } }}
        />
        <Button onClick={add} disabled={!draft.trim()}>Add</Button>
      </Stack>
    </Box>
  );
};
