import React, { useEffect, useState } from 'react';
import {
  Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, MenuItem, Stack, TextField,
} from '@mui/material';
import { Task, TASK_CATEGORIES, TaskCategory } from '../types/Task';
import { getErrorMessage, updateTask } from '../services/tasks';

interface EditTaskModalProps {
  task: Task;
  /** Called with `true` if changes were saved, `false` if cancelled. */
  onClose: (saved: boolean) => void;
}

export const EditTaskModal: React.FC<EditTaskModalProps> = ({ task, onClose }) => {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description);
  const [category, setCategory] = useState<TaskCategory>(task.category);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state if the task prop changes (e.g., if the modal is reused)
  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description);
    setCategory(task.category);
    setError(null);
  }, [task]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('Title cannot be empty.');
      return;
    }

    setIsSubmitting(true);
    try {
      await updateTask(task.id, { title, description, category });
      onClose(true);
    } catch (err) {
      console.error('Error updating task: ', err);
      setError(`Failed to save changes: ${getErrorMessage(err)}`);
      setIsSubmitting(false);
    }
  };

  const cancel = () => {
    if (!isSubmitting) onClose(false);
  };

  return (
    <Dialog
      open
      onClose={cancel}
      fullWidth
      maxWidth="sm"
      slotProps={{ paper: { component: 'form', onSubmit: handleSubmit } as object }}
      aria-labelledby="edit-task-title"
    >
      <DialogTitle id="edit-task-title">Edit Task</DialogTitle>
      <DialogContent>
        <Stack spacing={2} sx={{ pt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}
          <TextField
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
            fullWidth
          />
          <TextField
            label="Description (optional)"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            multiline
            minRows={4}
            fullWidth
          />
          <TextField
            select
            label="Category"
            value={category}
            onChange={(e) => setCategory(e.target.value as TaskCategory)}
            fullWidth
          >
            {TASK_CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={cancel} disabled={isSubmitting}>Cancel</Button>
        <Button type="submit" variant="contained" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
