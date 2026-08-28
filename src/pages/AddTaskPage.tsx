import React, { useState } from 'react';
import { collection, addDoc } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { TaskStatus } from '../types/Task';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useNavigate } from 'react-router-dom';

export const AddTaskPage: React.FC = () => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [category, setCategory] = useState('Personal');
  const userUID = user?.uid;

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !userUID) return;

    try {
      await addDoc(collection(db, 'tasks'), {
        title: newTaskTitle,
        description: '',
        status: 'not started' as TaskStatus,
        createdAt: Date.now(),
        userId: userUID,
        category: category
      });
      navigate('/'); // Redirect back to the task list
    } catch (error) {
      console.error("Error adding task: ", error);
    }
  };

  return (
    <div className="add-task-container">
      <h2>Add New Task</h2>
      <form onSubmit={handleAddTask}>
        <div className="filter-container">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            placeholder="Task title"
            required
          />
          <select
            name="task_category"
            id="task_category"
            value={category}
            onChange={(e) => setCategory(e.target.value)}>
            <option value="Personal">Personal</option>
            <option value="Work">Work</option>
          </select>
           <button type="submit">Add Task</button>
           <button type="button" onClick={() => navigate('/')} style={{marginLeft: '10px', backgroundColor: '#6c757d', color: 'white'}}>Cancel</button>
        </div>
      </form>
    </div>
  );
};
