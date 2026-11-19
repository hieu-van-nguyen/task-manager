import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { Alert, Box, Button, Stack, Typography } from '@mui/material';
import { auth } from '../firebase/config';
import { EMPTY_TASK_FIELDS, TaskFields } from '../types/Task';
import { createTask, getErrorMessage } from '../services/tasks';
import { useTasks } from '../hooks/useTasks';
import { getAllCategories } from '../utils/filterTasks';
import { TaskFormFields } from '../components/TaskFormFields';

export const AddTaskPage: React.FC = () => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const { tasks } = useTasks(); // only for category suggestions
  const categories = useMemo(() => getAllCategories(tasks), [tasks]);
  const [fields, setFields] = useState<TaskFields>(EMPTY_TASK_FIELDS);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const userId = user?.uid;

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!fields.title.trim()) {
      setError('Title cannot be empty.');
      return;
    }
    if (!userId) {
      setError('You must be signed in to add a task.');
      return;
    }

    setIsSubmitting(true);
    try {
      await createTask(userId, fields);
      navigate('/'); // Redirect back to the task list
    } catch (err) {
      console.error('Error adding task: ', err);
      setError(`Failed to add task: ${getErrorMessage(err)}`);
      setIsSubmitting(false);
    }
  };

  return (
    <Box component="form" onSubmit={handleAddTask} noValidate sx={{ maxWidth: 800 }}>
      <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
        Add New Task
      </Typography>
      {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error}</Alert>}
      <TaskFormFields
        value={fields}
        onChange={(changes) => setFields(prev => ({ ...prev, ...changes }))}
        categories={categories}
        autoFocus
      />
      <Stack direction="row" spacing={1} sx={{ mt: 3 }}>
        <Button type="submit" variant="contained" disabled={isSubmitting}>
          {isSubmitting ? 'Adding...' : 'Add Task'}
        </Button>
        <Button variant="outlined" color="secondary" onClick={() => navigate('/')} disabled={isSubmitting}>
          Cancel
        </Button>
      </Stack>
    </Box>
  );
};
