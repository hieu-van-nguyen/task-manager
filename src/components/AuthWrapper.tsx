import React from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { signOut, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import {
  Alert, AppBar, Button, CircularProgress, Container, Paper, Stack, Toolbar, Typography,
} from '@mui/material';
import { auth } from '../firebase/config';

const provider = new GoogleAuthProvider();

const APP_TITLE = 'Manage Your Tasks';

/**
 * App shell: shows auth loading/error/sign-in states, and once signed in renders
 * the top bar (user name + Log Out) and `children`.
 */
export const AuthWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, loading, error] = useAuthState(auth);

  if (loading) {
    return (
      <Stack alignItems="center" spacing={2} sx={{ mt: 10 }}>
        <CircularProgress />
        <Typography color="text.secondary">Loading authentication...</Typography>
      </Stack>
    );
  }

  if (!user) {
    return (
      <Container maxWidth="sm" sx={{ mt: { xs: 4, sm: 10 } }}>
        <Paper sx={{ p: { xs: 3, sm: 5 }, textAlign: 'center' }}>
          <Typography variant="h4" component="h1" color="primary" gutterBottom>
            {APP_TITLE}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 3 }}>
            Please sign in to manage your tasks.
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 3 }}>{error.message}</Alert>}
          <Button variant="contained" size="large" onClick={() => signInWithPopup(auth, provider)}>
            Sign in with Google
          </Button>
        </Paper>
      </Container>
    );
  }

  return (
    <>
      <AppBar position="static" color="primary">
        <Toolbar sx={{ gap: 2 }}>
          <Typography variant="h6" component="h1" sx={{ flexGrow: 1 }} noWrap>
            {APP_TITLE}
          </Typography>
          <Typography sx={{ display: { xs: 'none', sm: 'block' } }} noWrap>
            Welcome, {user.displayName}
          </Typography>
          <Button color="inherit" variant="outlined" onClick={() => signOut(auth)}>
            Log Out
          </Button>
        </Toolbar>
      </AppBar>
      <Container maxWidth="lg" sx={{ py: { xs: 2, sm: 4 } }}>
        <Paper sx={{ p: { xs: 2, sm: 3 } }}>
          {children}
        </Paper>
      </Container>
    </>
  );
};
