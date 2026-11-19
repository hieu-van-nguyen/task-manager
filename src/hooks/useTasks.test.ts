import { act, renderHook } from '@testing-library/react';
import { Task } from '../types/Task';
import { useTasks } from './useTasks';
import * as tasksService from '../services/tasks';
import { makeTask } from '../testUtils';

jest.mock('../firebase/config', () => ({ auth: {}, db: {} }));
jest.mock('react-firebase-hooks/auth', () => ({
  useAuthState: () => [{ uid: 'user-1' }, false, undefined],
}));
jest.mock('../services/tasks', () => ({
  subscribeToUserTasks: jest.fn(),
  updateTaskStatus: jest.fn(),
  deleteTask: jest.fn(),
  getErrorMessage: (err: unknown) => (err instanceof Error ? err.message : String(err)),
}));

const mockService = tasksService as jest.Mocked<typeof tasksService>;

const task = (id: string): Task => makeTask({ id, title: id });

let emit: (tasks: Task[]) => void;
let emitError: (err: Error) => void;
const unsubscribe = jest.fn();

beforeEach(() => {
  jest.clearAllMocks();
  jest.spyOn(console, 'error').mockImplementation(() => {}); // error-path tests log on purpose
  mockService.subscribeToUserTasks.mockImplementation((_uid, onChange, onError) => {
    emit = onChange;
    emitError = onError;
    return unsubscribe;
  });
});

test('subscribes for the signed-in user and reflects every pushed snapshot', () => {
  const { result } = renderHook(() => useTasks());
  expect(mockService.subscribeToUserTasks).toHaveBeenCalledWith('user-1', expect.any(Function), expect.any(Function));
  expect(result.current.loading).toBe(true);

  act(() => emit([task('a')]));
  expect(result.current.loading).toBe(false);
  expect(result.current.tasks.map(t => t.id)).toEqual(['a']);

  // e.g. a change made in another tab/device
  act(() => emit([task('a'), task('b')]));
  expect(result.current.tasks.map(t => t.id)).toEqual(['a', 'b']);
});

test('mutations do not refetch; failures surface in error', async () => {
  mockService.deleteTask.mockRejectedValueOnce(new Error('permission-denied'));
  const { result } = renderHook(() => useTasks());

  let ok = true;
  await act(async () => { ok = await result.current.remove(task('a')); });

  expect(ok).toBe(false);
  expect(result.current.error).toBe('Failed to delete task: permission-denied');
  expect(mockService.subscribeToUserTasks).toHaveBeenCalledTimes(1);
});

test('listener errors surface in error', () => {
  const { result } = renderHook(() => useTasks());
  act(() => emitError(new Error('offline')));
  expect(result.current.error).toBe('Failed to load tasks: offline');
  expect(result.current.loading).toBe(false);
});

test('unsubscribes on unmount', () => {
  const { unmount } = renderHook(() => useTasks());
  unmount();
  expect(unsubscribe).toHaveBeenCalledTimes(1);
});
