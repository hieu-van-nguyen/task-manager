import React from 'react';
import { TaskList } from '../components/TaskList';
import { useNavigate } from 'react-router-dom';

export const TaskListPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div>
      <TaskList />
    </div>
  );
};
