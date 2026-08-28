import React from 'react';
import { TaskList } from '../components/TaskList';
import { useNavigate } from 'react-router-dom';

export const TaskListPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div>
      <div style={{ marginBottom: '20px', textAlign: 'right' }}>
        <button
          onClick={() => navigate('/add')}
          style={{ backgroundColor: '#28a745', color: 'white', padding: '10px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          + Add New Task
        </button>
      </div>
      <TaskList />
    </div>
  );
};
