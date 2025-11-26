import React from 'react';
import './App.css';
import { AuthWrapper } from './components/AuthWrapper';
import { TaskList } from './components/TaskList';
import { auth } from './firebase/config';
import { useAuthState } from 'react-firebase-hooks/auth';

function App() {
  const [user] = useAuthState(auth);

  return (
    <div className="App">
      <h1>Manage Your Tasks</h1>
      {/* AuthWrapper handles login/logout and provides the user context */}
      <AuthWrapper>
        {/* TaskList only renders if the user is logged in (handled by AuthWrapper) */}
        {user ? <TaskList /> : <p>Please log in to manage your tasks.</p>}
      </AuthWrapper>
    </div>
  );
}

export default App;