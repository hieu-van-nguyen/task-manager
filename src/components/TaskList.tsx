// src/components/TaskList.tsx
// Container for the task views: filters, view switch (table / board / dashboard),
// and the edit + delete dialogs. Data comes live from useTasks().

import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Alert, Box, Button, InputAdornment, MenuItem, Stack, TextField, ToggleButton, ToggleButtonGroup, Typography,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import TableRowsIcon from '@mui/icons-material/TableRows';
import ViewKanbanIcon from '@mui/icons-material/ViewKanban';
import InsightsIcon from '@mui/icons-material/Insights';
import {
  PRIORITY_LABELS, STATUS_LABELS, Task, TASK_PRIORITIES, TASK_STATUSES, TaskPriority, TaskStatus,
} from '../types/Task';
import { useTasks } from '../hooks/useTasks';
import {
  EMPTY_FILTERS, TaskFilters, filterAndSortTasks, getAllCategories, hasActiveFilters,
} from '../utils/filterTasks';
import { EditTaskModal } from './EditTaskModal';
import { ConfirmDialog } from './ConfirmDialog';
import { TaskTable } from './TaskTable';
import { TaskBoard } from './TaskBoard';
import { TaskDashboard } from './TaskDashboard';

type View = 'table' | 'board' | 'dashboard';
const VIEW_KEY = 'taskManager.view';

// localStorage can throw (private mode, blocked storage); the view choice is only a convenience.
const loadView = (): View => {
  try {
    const v = localStorage.getItem(VIEW_KEY);
    return v === 'board' || v === 'dashboard' ? v : 'table';
  } catch {
    return 'table';
  }
};
const saveView = (view: View) => {
  try {
    localStorage.setItem(VIEW_KEY, view);
  } catch {
    /* ignore */
  }
};

export const TaskList: React.FC = () => {
  const navigate = useNavigate();
  const {
    tasks: allTasks, loading, error, clearError, updateStatus, bulkUpdateStatus, bulkRemove,
  } = useTasks();
  const [view, setView] = useState<View>(loadView);
  const [filters, setFilters] = useState<TaskFilters>(EMPTY_FILTERS);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [tasksToDelete, setTasksToDelete] = useState<Task[]>([]);

  const tasks = useMemo(() => filterAndSortTasks(allTasks, filters), [allTasks, filters]);
  const categories = useMemo(() => getAllCategories(allTasks), [allTasks]);

  const updateFilter = <K extends keyof TaskFilters>(key: K, value: TaskFilters[K]) =>
    setFilters(prev => ({ ...prev, [key]: value }));

  const changeView = (_: unknown, next: View | null) => {
    if (!next) return;
    setView(next);
    saveView(next);
  };

  const confirmDelete = async () => {
    const ids = tasksToDelete.map(t => t.id);
    setTasksToDelete([]);
    await bulkRemove(ids);
  };

  const deleteMessage =
    tasksToDelete.length === 1
      ? <>"{tasksToDelete[0].title}" will be permanently deleted. This cannot be undone.</>
      : <>{tasksToDelete.length} tasks will be permanently deleted. This cannot be undone.</>;

  return (
    <Box>
      {error && (
        <Alert severity="error" onClose={clearError} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack
        direction={{ xs: 'column', sm: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', sm: 'center' }}
        justifyContent="space-between"
        sx={{ mb: 2 }}
      >
        <Typography variant="h5" component="h2">
          Your Tasks ({view === 'dashboard' ? allTasks.length : tasks.length})
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <ToggleButtonGroup value={view} exclusive onChange={changeView} size="small" aria-label="View">
            <ToggleButton value="table" aria-label="Table view"><TableRowsIcon sx={{ mr: 0.5 }} fontSize="small" />Table</ToggleButton>
            <ToggleButton value="board" aria-label="Board view"><ViewKanbanIcon sx={{ mr: 0.5 }} fontSize="small" />Board</ToggleButton>
            <ToggleButton value="dashboard" aria-label="Dashboard view"><InsightsIcon sx={{ mr: 0.5 }} fontSize="small" />Dashboard</ToggleButton>
          </ToggleButtonGroup>
          <Button variant="contained" color="success" onClick={() => navigate('/add')} sx={{ whiteSpace: 'nowrap' }}>
            + Add Task
          </Button>
        </Stack>
      </Stack>

      {view !== 'dashboard' && (
        <Stack
          direction={{ xs: 'column', md: 'row' }}
          spacing={1.5}
          alignItems={{ xs: 'stretch', md: 'center' }}
          useFlexGap
          flexWrap="wrap"
          sx={{ mb: 2, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}
        >
          <TextField
            placeholder="Search title, description, subtasks"
            value={filters.search}
            onChange={(e) => updateFilter('search', e.target.value)}
            sx={{ flex: 1, minWidth: 220 }}
            slotProps={{
              htmlInput: { 'aria-label': 'Search tasks' },
              input: { startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> },
            }}
          />
          <TextField
            id="date-filter"
            label="Created on"
            type="date"
            value={filters.date}
            onChange={(e) => updateFilter('date', e.target.value)}
            slotProps={{ inputLabel: { shrink: true } }}
          />
          <TextField
            id="status-filter"
            select
            label="Status"
            value={filters.status}
            onChange={(e) => updateFilter('status', e.target.value as TaskStatus | '')}
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="">All</MenuItem>
            {TASK_STATUSES.map(s => <MenuItem key={s} value={s}>{STATUS_LABELS[s]}</MenuItem>)}
          </TextField>
          <TextField
            id="priority-filter"
            select
            label="Priority"
            value={filters.priority}
            onChange={(e) => updateFilter('priority', e.target.value as TaskPriority | '')}
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="">All</MenuItem>
            {TASK_PRIORITIES.map(p => <MenuItem key={p} value={p}>{PRIORITY_LABELS[p]}</MenuItem>)}
          </TextField>
          <TextField
            id="category-filter"
            select
            label="Category"
            value={filters.category}
            onChange={(e) => updateFilter('category', e.target.value)}
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="">All</MenuItem>
            {categories.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
          </TextField>
          <Button
            variant="outlined"
            color="secondary"
            onClick={() => setFilters(EMPTY_FILTERS)}
            disabled={!hasActiveFilters(filters)}
          >
            Clear Filters
          </Button>
        </Stack>
      )}

      {view === 'table' && (
        <TaskTable
          tasks={tasks}
          loading={loading}
          onEdit={setTaskToEdit}
          onDelete={setTasksToDelete}
          onStatusChange={updateStatus}
          onBulkStatusChange={bulkUpdateStatus}
        />
      )}
      {view === 'board' && (
        <TaskBoard
          tasks={tasks}
          onEdit={setTaskToEdit}
          onDelete={setTasksToDelete}
          onStatusChange={updateStatus}
        />
      )}
      {view === 'dashboard' && <TaskDashboard tasks={allTasks} />}

      {taskToEdit && (
        <EditTaskModal task={taskToEdit} categories={categories} onClose={() => setTaskToEdit(null)} />
      )}
      <ConfirmDialog
        open={tasksToDelete.length > 0}
        title={tasksToDelete.length > 1 ? `Delete ${tasksToDelete.length} tasks?` : 'Delete task?'}
        message={deleteMessage}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setTasksToDelete([])}
      />
    </Box>
  );
};
