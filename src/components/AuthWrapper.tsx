// src/components/AuthWrapper.tsx (Simplified)

import React from 'react';
import { auth } from '../firebase/config';
import { useAuthState } from 'react-firebase-hooks/auth';
import { signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const provider = new GoogleAuthProvider();

export const AuthWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, loading, error] = useAuthState(auth);

  if (loading) {
    return <div>Loading Authentication...</div>;
  }
  
  if (error) {
    return <div>Error: {error.message}</div>;
  }

  if (!user) {
    return (
      <div className="login-container">
        <h2>Please Login To Manage Your Tasks</h2>
        <button onClick={() => signInWithPopup(auth, provider)}>
          Sign in with Google
        </button>
      </div>
    );
  }

  return (
    <>
      <header>
        <span>Welcome, {user.displayName}</span>
        <button onClick={() => signOut(auth)}>Log Out</button>
      </header>
      {children}
    </>
  );
};