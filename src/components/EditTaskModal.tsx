import React, { useState, useEffect } from 'react';
import { updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/config';
import { Task } from '../types/Task';
import { Alert } from '@mui/material';
import './EditTaskModal.css'; // We'll add styles in the next step

interface EditTaskModalProps {
  task: Task;
  onClose: () => void;
}

export const EditTaskModal: React.FC<EditTaskModalProps> = ({ task, onClose }) => {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Sync state if the task prop changes (e.g., if the modal is reused)
  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description || '');
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
      const taskDocRef = doc(db, 'tasks', task.id);
      await updateDoc(taskDocRef, {
        title: title.trim(),
        description: description.trim(),
      });
      onClose();
    } catch (error) {
      console.error("Error updating document: ", error);
      setError(`Failed to save changes: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h3>Edit Task</h3>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <form onSubmit={handleSubmit}>
          <label>Title:</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
          />

          <label>Description (Optional):</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
          />

          <div className="modal-actions">
            <button type="button" onClick={onClose} disabled={isSubmitting}>
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};