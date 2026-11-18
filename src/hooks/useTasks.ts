import { useCallback, useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/config';
import { Task, TaskStatus } from '../types/Task';
import * as tasksService from '../services/tasks';

/**
 * Live list of the signed-in user's tasks (Firestore onSnapshot), plus mutations.
 * There is no manual refetching: every write, from this tab, another tab or another
 * device, pushes a new snapshot. Errors are captured in `error` rather than thrown.
 */
export const useTasks = () => {
  const [user] = useAuthState(auth);
  const userId = user?.uid;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setTasks([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const unsubscribe = tasksService.subscribeToUserTasks(
      userId,
      (next) => {
        setTasks(next);
        setLoading(false);
      },
      (err) => {
        console.error(err);
        setError(`Failed to load tasks: ${tasksService.getErrorMessage(err)}`);
        setLoading(false);
      }
    );
    return unsubscribe; // Stop listening on sign-out / unmount.
  }, [userId]);

  /** Runs a mutation. Returns false (and sets `error`) on failure. */
  const mutate = useCallback(async (action: () => Promise<void>, failureMessage: string) => {
    try {
      await action();
      return true;
    } catch (err) {
      console.error(err);
      setError(`${failureMessage}: ${tasksService.getErrorMessage(err)}`);
      return false;
    }
  }, []);

  const updateStatus = useCallback(
    (task: Task, status: TaskStatus) =>
      mutate(() => tasksService.updateTaskStatus(task.id, status), 'Failed to update status'),
    [mutate]
  );

  const remove = useCallback(
    (task: Task) => mutate(() => tasksService.deleteTask(task.id), 'Failed to delete task'),
    [mutate]
  );

  return {
    tasks,
    loading,
    error,
    clearError: () => setError(null),
    updateStatus,
    remove,
  };
};
