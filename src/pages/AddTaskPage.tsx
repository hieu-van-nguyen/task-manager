import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { TaskStatus } from '../types/Task';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useNavigate } from 'react-router-dom';
import { Alert } from '@mui/material';

export const AddTaskPage: React.FC = () => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [category, setCategory] = useState('Personal');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const userUID = user?.uid;

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!newTaskTitle.trim()) {
      setError('Title cannot be empty.');
      return;
    }
    if (!userUID) {
      setError('You must be signed in to add a task.');
      return;
    }

    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'tasks'), {
        title: newTaskTitle.trim(),
        description: '',
        status: 'not started' as TaskStatus,
        createdAt: Date.now(),
        userId: userUID,
        category: category
      });
      navigate('/'); // Redirect back to the task list
    } catch (error) {
      console.error("Error adding task: ", error);
      setError(`Failed to add task: ${error instanceof Error ? error.message : String(error)}`);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="add-task-container">
      <h2>Add New Task</h2>
      {error && <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>{error}</Alert>}
      <form onSubmit={handleAddTask}>
        <div className="filter-container">
          <textarea
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Task title"
            required
            rows={5}
            style={{ width: '70%' }}
          />
          <select
            name="task_category"
            id="task_category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}>
            <option value="Personal">Personal</option>
            <option value="Work">Work</option>
          </select>
        </div>
        <div className="button-container" style={{ display: 'flex', gap: '10px', justifyContent: 'flex-start' }}>
           <button type="submit" disabled={isSubmitting}>{isSubmitting ? 'Adding...' : 'Add Task'}</button>
           <button type="button" onClick={() => navigate('/')} style={{backgroundColor: '#6c757d', color: 'white'}}>Cancel</button>
        </div>
      </form>
    </div>
  );
};
