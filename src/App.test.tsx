import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

// Keep tests independent of the real Firebase project / gitignored config values.
jest.mock('./firebase/config', () => ({ auth: {}, db: {} }));
jest.mock('firebase/auth', () => ({
  GoogleAuthProvider: jest.fn(),
  signInWithPopup: jest.fn(),
  signOut: jest.fn(),
}));

const mockUseAuthState = jest.fn();
jest.mock('react-firebase-hooks/auth', () => ({
  useAuthState: () => mockUseAuthState(),
}));

test('shows the Google sign-in button when logged out', () => {
  mockUseAuthState.mockReturnValue([null, false, undefined]);
  render(<App />);
  expect(screen.getByRole('button', { name: /sign in with google/i })).toBeInTheDocument();
});

test('shows a loading message while auth state is resolving', () => {
  mockUseAuthState.mockReturnValue([null, true, undefined]);
  render(<App />);
  expect(screen.getByText(/loading authentication/i)).toBeInTheDocument();
});
