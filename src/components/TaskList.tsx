// src/components/TaskList.tsx

import React, { useEffect, useState } from 'react';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { collection, query, where, orderBy, addDoc, doc, updateDoc, deleteDoc, getDocs, Timestamp } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { Task, TaskStatus } from '../types/Task';
import { useAuthState } from 'react-firebase-hooks/auth';
import { EditTaskModal } from './EditTaskModal';
import { DataGrid } from '@mui/x-data-grid';
import { Typography } from '@mui/material';

export const TaskList: React.FC = () => {
  const [user] = useAuthState(auth);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [filterDate, setFilterDate] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("Personal");
  const userUID = user?.uid;
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
      renderCell: (params:any) => {
        return (
          <select
              value={params.row.status}
              onChange={(e) => handleUpdateStatus(params.row, e.target.value as TaskStatus)}
          >
              <option value="not started">Not Started</option>
              <option value="started">Started</option>
              <option value="completed">Completed</option>
          </select>
        );
      },
    },
    {
      field: 'createdAt', headerName: 'Create Date', width: 200,
      renderCell: (params:any) => {
        return (
          <>
            {getDateFromTimestamp(params.row.createdAt)}
          </>
        );
      },
    },
    {
      field: 'action', headerName: '', width: 250,
      renderCell: (params:any) => {
        return (
          <div>
            <button onClick={() => openEditModal(params.row)} className="edit-button">Edit</button>
            <button style={{marginLeft: 20}} onClick={() => handleDeleteTask(params.row.id)}>Delete</button>
          </div>
        );
      },
    }
  ]

  const tasksRef = collection(db, 'tasks');
  const q = query(
    tasksRef, 
    where('userId', '==', userUID), // Only fetch tasks for the logged-in user
    orderBy('createdAt', 'desc')
  );

  /* const [tasks, loading, error] = useCollectionData<Task>(q, {
    idField: 'id' 
  }); */
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');

  const fetchTasks = async () => {
    setLoading(true);
    try {
        const querySnapshot = await getDocs(tasksRef);
        let taskList: Task[] = querySnapshot.docs.map(doc => {
            const data = doc.data();
            return {
                id: doc.id, // The Firestore document ID
                title: data.title,
                description: data.description,
                status: data.status,
                createdAt: data.createdAt, // Timestamp
                userId: data.userId,
                category: data.category && data.category.length > 0 ? data.category : 'Personal'
            };
        });
        taskList = taskList.filter(t => t.userId === userUID);
        if (filterDate) {
            const startDate = new Date(filterDate);
            const endDate = new Date(startDate);
            endDate.setDate(endDate.getDate() + 1);
            const startTimestamp = startDate.getTime();
            const endTimestamp = endDate.getTime();
            taskList = taskList.filter(t => t.createdAt >= startTimestamp && t.createdAt <= endTimestamp);
        }
        if (status) {
          taskList = taskList.filter(t => t.status === status);
        }
        if (filterCategory) {
          taskList = taskList.filter(t => t.category === filterCategory);
        }
        taskList.sort((a, b) => {
          const dateA = new Date(a.createdAt);
          const dateB = new Date(b.createdAt);
          if (dateA < dateB) {
            return 1;
          } else if (dateA > dateB) {
            return -1;
          }
          return 0;
        });
        setTasks(taskList);
    } catch (err) {
        console.log(err);
    } finally {
        setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [filterDate, status, filterCategory]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !userUID) return;

    await addDoc(tasksRef, {
      title: newTaskTitle,
      description: '', 
      status: 'not started' as TaskStatus,
      createdAt: Date.now(),
      userId: userUID,
      category: category
    });

    setNewTaskTitle('');
    fetchTasks();
  };

  const handleUpdateStatus = async (task: Task, newStatus: TaskStatus) => {
    const taskDocRef = doc(db, 'tasks', task.id);
    await updateDoc(taskDocRef, {
      status: newStatus,
    });
    fetchTasks();
  };

  const handleDeleteTask = async (taskId: string) => {
    const taskDocRef = doc(db, 'tasks', taskId);
    await deleteDoc(taskDocRef);
    fetchTasks();
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

  const getDateFromTimestamp = (ts: number) => {
    const date: Date = new Date(ts);
    return date.toLocaleString();
  }

  if (loading) return <div>Loading tasks...</div>;
  if (error) return <div>Error fetching tasks:</div>;

  return (
    <div>
      <h2>Add New Task</h2>
      <form onSubmit={handleAddTask}>
        <div  className="filter-container">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => {
              setNewTaskTitle(e.target.value)
            }}
            placeholder="Task title"
          />
          <br />
          <select 
            name="task_category" 
            id="task_category"
            onChange={(e) => {
              setCategory(e.target.value);
            }}>
            <option value="Personal">Personal</option>
            <option value="Work">Work</option>
          </select>
           <button type="submit">Add Task</button>
        </div>
      </form>
      <hr />
      <div className="filter-container">
        <label htmlFor="date-filter">Filter tasks created on:</label>
        <input
          id="date-filter"
          type="date"
          value={filterDate}
          onChange={(e) => {
            setFilterDate(e.target.value)
          }}
        />
        <button onClick={() => setFilterDate('')}>Clear Filter</button>
      </div>
      <div className="filter-container">
        <label htmlFor="status-filter">Filter tasks by status:</label>
        <select
          id="status-select"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value)
          }}
        >
          <option value="">All</option>
          <option value="not started">not started</option>
          <option value="started">started</option>
          <option value="completed">completed</option>
        </select>
      </div>
      <hr />
      <div className="filter-container">
        <label htmlFor="status-filter">Filter tasks by category:</label>
        <select
          id="category-select"
          value={filterCategory}
          onChange={(e) => {
            setFilterCategory(e.target.value)
          }}
        >
          <option value="">All</option>
          <option value="Personal">Personal</option>
          <option value="Work">Work</option>
        </select>
      </div>
      <hr />
      
      <h2>Your Tasks ({tasks?.length})</h2>
      <div style={{height: "500px", width: "100%"}}>
        <DataGrid
          rows={tasks}
          columns={columns}
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