// src/components/TaskList.tsx

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { collection, query, where, doc, updateDoc, deleteDoc, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { Task, TaskStatus } from '../types/Task';
import { useAuthState } from 'react-firebase-hooks/auth';
import { EditTaskModal } from './EditTaskModal';
import { DataGrid } from '@mui/x-data-grid';
import { Alert } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { EMPTY_FILTERS, TaskFilters, filterAndSortTasks } from '../utils/filterTasks';

const getErrorMessage = (err: unknown) => (err instanceof Error ? err.message : String(err));

export const TaskList: React.FC = () => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [filters, setFilters] = useState<TaskFilters>(EMPTY_FILTERS);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const userUID = user?.uid;

  const fetchTasks = useCallback(async () => {
    if (!userUID) return;
    setLoading(true);
    try {
      const q = query(
        collection(db, 'tasks'),
        where('userId', '==', userUID) // Only fetch tasks for the logged-in user
      );
      const querySnapshot = await getDocs(q);
      setAllTasks(querySnapshot.docs.map(d => {
        const data = d.data();
        return {
          id: d.id, // The Firestore document ID
          title: data.title,
          description: data.description,
          status: data.status,
          createdAt: data.createdAt, // epoch milliseconds
          userId: data.userId,
          category: data.category && data.category.length > 0 ? data.category : 'Personal'
        };
      }));
      setError(null);
    } catch (err) {
      console.error(err);
      setError(`Failed to load tasks: ${getErrorMessage(err)}`);
    } finally {
      setLoading(false);
    }
  }, [userUID]);

  // Fetch once per user; filtering happens client-side so it doesn't need a refetch.
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const tasks = useMemo(() => filterAndSortTasks(allTasks, filters), [allTasks, filters]);

  const updateFilter = (key: keyof TaskFilters, value: string) =>
    setFilters(prev => ({ ...prev, [key]: value }));

  const handleUpdateStatus = async (task: Task, newStatus: TaskStatus) => {
    try {
      await updateDoc(doc(db, 'tasks', task.id), { status: newStatus });
      await fetchTasks();
    } catch (err) {
      console.error(err);
      setError(`Failed to update status: ${getErrorMessage(err)}`);
    }
  };

  const handleDeleteTask = async (task: Task) => {
    if (!window.confirm(`Delete task "${task.title}"? This cannot be undone.`)) return;
    try {
      await deleteDoc(doc(db, 'tasks', task.id));
      await fetchTasks();
    } catch (err) {
      console.error(err);
      setError(`Failed to delete task: ${getErrorMessage(err)}`);
    }
  };

  // Handlers for modal
  const openEditModal = (task: Task) => {
    setTaskToEdit(task);
    setIsModalOpen(true);
  };

  const closeEditModal = () => {
    setIsModalOpen(false);
    setTaskToEdit(null); // Clear the task being edited
    fetchTasks();
  };

  const columns = [
    {
      field: 'category', headerName: 'Category', width: 110
    },
    {
      field: 'title', headerName: 'Title', width: 500
    },
    {
      field: 'status', headerName: 'Status', width: 110
    },
    {
      field: 'update_status', headerName: 'Update Status', width: 110,
      renderCell: (params: any) => (
        <select
          value={params.row.status}
          onChange={(e) => handleUpdateStatus(params.row, e.target.value as TaskStatus)}
        >
          <option value="not started">Not Started</option>
          <option value="started">Started</option>
          <option value="completed">Completed</option>
        </select>
      ),
    },
    {
      field: 'createdAt', headerName: 'Create Date', width: 200,
      renderCell: (params: any) => <>{new Date(params.row.createdAt).toLocaleString()}</>,
    },
    {
      field: 'action', headerName: '', width: 250,
      renderCell: (params: any) => (
        <div>
          <button onClick={() => openEditModal(params.row)} className="edit-button">Edit</button>
          <button style={{ marginLeft: 20 }} onClick={() => handleDeleteTask(params.row)}>Delete</button>
        </div>
      ),
    }
  ];

  return (
    <div>
      {error && (
        <Alert severity="error" onClose={() => setError(null)} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      <div className="filter-container">
        <div className="filter-group">
          <label htmlFor="date-filter">Filter tasks created on:</label>
          <input
            id="date-filter"
            type="date"
            value={filters.date}
            onChange={(e) => updateFilter('date', e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label htmlFor="status-filter">Filter tasks by status:</label>
          <select
            id="status-filter"
            value={filters.status}
            onChange={(e) => updateFilter('status', e.target.value)}
          >
            <option value="">All</option>
            <option value="not started">not started</option>
            <option value="started">started</option>
            <option value="completed">completed</option>
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="category-filter">Filter tasks by category:</label>
          <select
            id="category-filter"
            value={filters.category}
            onChange={(e) => updateFilter('category', e.target.value)}
          >
            <option value="">All</option>
            <option value="Personal">Personal</option>
            <option value="Work">Work</option>
          </select>
        </div>
        <button
          className="btn-action-fixed"
          style={{ marginLeft: 'auto' }}
          onClick={() => setFilters(EMPTY_FILTERS)}
        >
          Clear Filter
        </button>
      </div>
      <div style={{ marginBottom: '20px' }}>
        <button onClick={() => navigate('/add')} style={{ backgroundColor: '#28a745', color: 'white' }}>
          + Add New Task
        </button>
      </div>

      <h2>Your Tasks ({tasks.length})</h2>
      <div style={{ height: "500px", width: "100%" }}>
        <DataGrid
          rows={tasks}
          columns={columns}
          loading={loading}
        />
      </div>
      {isModalOpen && taskToEdit && (
        <EditTaskModal
          task={taskToEdit}
          onClose={closeEditModal}
        />
      )}
    </div>
  );
};
