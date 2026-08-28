import React from 'react';
import './App.css';
import { AuthWrapper } from './components/AuthWrapper';
import { auth } from './firebase/config';
import { useAuthState } from 'react-firebase-hooks/auth';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { TaskListPage } from './pages/TaskListPage';
import { AddTaskPage } from './pages/AddTaskPage';

function App() {
  const [user] = useAuthState(auth);

  return (
    <div className="App">
      <h1>Manage Your Tasks</h1>
      {/* AuthWrapper handles login/logout and provides the user context */}
      <AuthWrapper>
        {user ? (
          <Router>
            <Routes>
              <Route path="/" element={<TaskListPage />} />
              <Route path="/add" element={<AddTaskPage />} />
            </Routes>
          </Router>
        ) : (
          <p>Please log in to manage your tasks.</p>
        )}
      </AuthWrapper>
    </div>
  );
}

export default App;