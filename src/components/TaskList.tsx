// src/components/TaskList.tsx

import React, { useEffect, useState } from 'react';
import { useCollectionData } from 'react-firebase-hooks/firestore';
import { collection, query, where, orderBy, addDoc, doc, updateDoc, deleteDoc, getDocs, Timestamp } from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { Task, TaskStatus } from '../types/Task';
import { useAuthState } from 'react-firebase-hooks/auth';
import { EditTaskModal } from './EditTaskModal';

export const TaskList: React.FC = () => {
  const [user] = useAuthState(auth);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [filterDate, setFilterDate] = useState('');
  const userUID = user?.uid;

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
                userId: data.userId
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
  }, [filterDate]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim() || !userUID) return;

    await addDoc(tasksRef, {
      title: newTaskTitle,
      description: '', 
      status: 'not started' as TaskStatus,
      createdAt: Date.now(),
      userId: userUID,
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

  if (loading) return <div>Loading tasks...</div>;
  if (error) return <div>Error fetching tasks:</div>;

  return (
    <div>
      <h2>Add New Task</h2>
      <form onSubmit={handleAddTask}>
        <input
          type="text"
          value={newTaskTitle}
          onChange={(e) => {
            setNewTaskTitle(e.target.value)
          }}
          placeholder="Task title"
        />
        <button type="submit">Add Task</button>
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
      <hr />
      
      <h2>Your Tasks ({tasks?.length})</h2>
      <div className="tasks-list">
        {tasks?.map((task) => (
          <div key={task.id} className={`task-item task-${task.status.replace(' ', '-')}`}>
            <h3>{task.title}</h3>
            <p>Status: <strong>{task.status}</strong></p>
            <div className="task-actions">
                <select
                    value={task.status}
                    onChange={(e) => handleUpdateStatus(task, e.target.value as TaskStatus)}
                >
                    <option value="not started">Not Started</option>
                    <option value="started">Started</option>
                    <option value="completed">Completed</option>
                </select>
                <button onClick={() => openEditModal(task)} className="edit-button">
                    Edit
                </button>
                <button onClick={() => handleDeleteTask(task.id)}>Delete</button>
            </div>
          </div>
        ))}
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