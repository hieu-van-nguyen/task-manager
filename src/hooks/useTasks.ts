import { useCallback, useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/config';
import { Task, TaskStatus } from '../types/Task';
import * as tasksService from '../services/tasks';

/**
 * Loads the signed-in user's tasks and exposes mutations that refresh the list
 * afterwards. Errors are captured in `error` rather than thrown.
 */
export const useTasks = () => {
  const [user] = useAuthState(auth);
  const userId = user?.uid;
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!userId) return;
    setLoading(true);
    try {
      setTasks(await tasksService.fetchUserTasks(userId));
      setError(null);
    } catch (err) {
      console.error(err);
      setError(`Failed to load tasks: ${tasksService.getErrorMessage(err)}`);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  /** Runs a mutation, then refreshes. Returns false (and sets `error`) on failure. */
  const mutate = useCallback(
    async (action: () => Promise<void>, failureMessage: string) => {
      try {
        await action();
        await refresh();
        return true;
      } catch (err) {
        console.error(err);
        setError(`${failureMessage}: ${tasksService.getErrorMessage(err)}`);
        return false;
      }
    },
    [refresh]
  );

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
    refresh,
    updateStatus,
    remove,
  };
};
