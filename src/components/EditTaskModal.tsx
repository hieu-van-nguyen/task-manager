import React, { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle } from '@mui/material';
import { Task, TaskFields } from '../types/Task';
import { getErrorMessage, updateTask } from '../services/tasks';
import { getChangedFields, pickFields } from '../utils/taskDiff';
import { TaskFormFields } from './TaskFormFields';

interface EditTaskModalProps {
  task: Task;
  categories: string[];
  /** Called after saving or cancelling. The task list updates itself via its live subscription. */
  onClose: () => void;
}

/** Edits every user-editable field: title, description, category, priority, due date, status, subtasks. */
export const EditTaskModal: React.FC<EditTaskModalProps> = ({ task, categories, onClose }) => {
  const original = useMemo(() => pickFields(task), [task]);
  const [fields, setFields] = useState<TaskFields>(original);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset the form if a different task is passed in.
  useEffect(() => {
    setFields(original);
    setError(null);
  }, [original]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!fields.title.trim()) {
      setError('Title cannot be empty.');
      return;
    }

    const changes = getChangedFields(original, fields);
    if (Object.keys(changes).length === 0) {
      onClose();
      return;
    }

    setIsSubmitting(true);
    try {
      await updateTask(task.id, changes);
      onClose();
    } catch (err) {
      console.error('Error updating task: ', err);
      setError(`Failed to save changes: ${getErrorMessage(err)}`);
      setIsSubmitting(false);
    }
  };

  const cancel = () => {
    if (!isSubmitting) onClose();
  };

  return (
    <Dialog
      open
      onClose={cancel}
      fullWidth
      maxWidth="md"
      slotProps={{ paper: { component: 'form', onSubmit: handleSubmit } as object }}
      aria-labelledby="edit-task-title"
    >
      <DialogTitle id="edit-task-title">Edit Task</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <div style={{ paddingTop: 8 }}>
          <TaskFormFields
            value={fields}
            onChange={(changes) => setFields(prev => ({ ...prev, ...changes }))}
            categories={categories}
            showStatus
            autoFocus
          />
        </div>
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
