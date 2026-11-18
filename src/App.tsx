import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthWrapper } from './components/AuthWrapper';
import { TaskListPage } from './pages/TaskListPage';
import { AddTaskPage } from './pages/AddTaskPage';

function App() {
  return (
    // AuthWrapper only renders its children once a user is signed in.
    <AuthWrapper>
      <Router>
        <Routes>
          <Route path="/" element={<TaskListPage />} />
          <Route path="/add" element={<AddTaskPage />} />
        </Routes>
      </Router>
    </AuthWrapper>
  );
}

export default App;
