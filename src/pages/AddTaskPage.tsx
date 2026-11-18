import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Alert, Box, Button, MenuItem, Stack, TextField, Typography } from '@mui/material';
import { auth } from '../firebase/config';
import { TASK_CATEGORIES, TaskCategory } from '../types/Task';
import { createTask, getErrorMessage } from '../services/tasks';

export const AddTaskPage: React.FC = () => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>('Personal');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const userId = user?.uid;

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!title.trim()) {
      setError('Title cannot be empty.');
      return;
    }
    if (!userId) {
      setError('You must be signed in to add a task.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createTask(userId, { title, description: '', category });
      navigate('/'); // Redirect back to the task list
    } catch (err) {
      console.error('Error adding task: ', err);
      setError(`Failed to add task: ${getErrorMessage(err)}`);
      setIsSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleAddTask} noValidate sx={{ maxWidth: 720 }}>
      <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
        Add New Task
      </Typography>
      <Stack spacing={2}>
        {error && <Alert severity="error" onClose={() => setError(null)}>{error}</Alert>}
        <TextField
          label="Task title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          autoFocus
          multiline
          minRows={3}
          fullWidth
        />
        <TextField
          select
          label="Category"
          value={category}
          onChange={(e) => setCategory(e.target.value as TaskCategory)}
          sx={{ maxWidth: 240 }}
        >
          {TASK_CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
        </TextField>
        <Stack direction="row" spacing={1}>
          <Button type="submit" variant="contained" disabled={isSubmitting}>
            {isSubmitting ? 'Adding...' : 'Add Task'}
          </Button>
          <Button variant="outlined" color="secondary" onClick={() => navigate('/')} disabled={isSubmitting}>
            Cancel
          </Button>
        </Stack>
      </Stack>
    </Box>
  );
};
