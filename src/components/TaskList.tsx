// src/components/TaskList.tsx

import React, { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { Alert, Box, Button, MenuItem, Select, Stack, TextField, Typography } from '@mui/material';
import { STATUS_LABELS, Task, TASK_CATEGORIES, TASK_STATUSES, TaskCategory, TaskStatus } from '../types/Task';
import { useTasks } from '../hooks/useTasks';
import { EMPTY_FILTERS, TaskFilters, filterAndSortTasks } from '../utils/filterTasks';
import { EditTaskModal } from './EditTaskModal';
import { ConfirmDialog } from './ConfirmDialog';

const STATUS_OPTIONS = TASK_STATUSES.map(value => ({ value, label: STATUS_LABELS[value] }));

/** Firestore times are epoch ms; the grid's dateTime columns need Date objects. */
const toDate = (value: number | null | undefined) => (value ? new Date(value) : null);

export const TaskList: React.FC = () => {
  const navigate = useNavigate();
  const { tasks: allTasks, loading, error, clearError, updateStatus, remove } = useTasks();
  const [filters, setFilters] = useState<TaskFilters>(EMPTY_FILTERS);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [taskToDelete, setTaskToDelete] = useState<Task | null>(null);

  const tasks = useMemo(() => filterAndSortTasks(allTasks, filters), [allTasks, filters]);

  const updateFilter = <K extends keyof TaskFilters>(key: K, value: TaskFilters[K]) =>
    setFilters(prev => ({ ...prev, [key]: value }));

  const confirmDelete = async () => {
    if (!taskToDelete) return;
    const task = taskToDelete;
    setTaskToDelete(null);
    await remove(task);
  };

  // No refresh needed after saving: the live subscription picks up the change.
  const closeEditModal = () => setTaskToEdit(null);

  const columns: GridColDef<Task>[] = [
    {
      field: 'category', headerName: 'Category', width: 110,
      type: 'singleSelect', valueOptions: [...TASK_CATEGORIES],
    },
    {
      field: 'title', headerName: 'Title', flex: 1, minWidth: 250,
    },
    {
      // Single status column: the value drives sorting/filtering/search/export,
      // the dropdown lets the user change it inline.
      field: 'status', headerName: 'Status', width: 160,
      type: 'singleSelect', valueOptions: STATUS_OPTIONS,
      renderCell: (params: GridRenderCellParams<Task, TaskStatus>) => (
        <Select
          value={params.row.status}
          size="small"
          variant="standard"
          disableUnderline
          fullWidth
          inputProps={{ 'aria-label': `Status for ${params.row.title}` }}
          onChange={(e) => updateStatus(params.row, e.target.value as TaskStatus)}
          // Keep keyboard input in the dropdown instead of the grid's cell navigation.
          onKeyDown={(e) => e.stopPropagation()}
        >
          {STATUS_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
        </Select>
      ),
    },
    {
      field: 'createdAt', headerName: 'Created', width: 190,
      type: 'dateTime', valueGetter: toDate,
    },
    {
      // Hidden by default; can be shown from the toolbar's Columns menu.
      field: 'updatedAt', headerName: 'Updated', width: 190,
      type: 'dateTime', valueGetter: toDate,
    },
    {
      field: 'completedAt', headerName: 'Completed', width: 190,
      type: 'dateTime', valueGetter: toDate,
    },
    {
      field: 'action', headerName: 'Actions', width: 170,
      sortable: false, filterable: false, disableColumnMenu: true, disableExport: true,
      renderCell: (params: GridRenderCellParams<Task>) => (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ height: '100%' }}>
          <Button size="small" variant="outlined" onClick={() => setTaskToEdit(params.row)}>
            Edit
          </Button>
          <Button size="small" variant="outlined" color="error" onClick={() => setTaskToDelete(params.row)}>
            Delete
          </Button>
        </Stack>
      ),
    }
  ];

  return (
    <Box>
      {error && (
        <Alert severity="error" onClose={clearError} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Stack
        direction={{ xs: 'column', md: 'row' }}
        spacing={2}
        alignItems={{ xs: 'stretch', md: 'center' }}
        sx={{ mb: 3, p: 2, bgcolor: 'grey.50', borderRadius: 1 }}
      >
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
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">All</MenuItem>
          {STATUS_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
        </TextField>
        <TextField
          id="category-filter"
          select
          label="Category"
          value={filters.category}
          onChange={(e) => updateFilter('category', e.target.value as TaskCategory | '')}
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="">All</MenuItem>
          {TASK_CATEGORIES.map(c => <MenuItem key={c} value={c}>{c}</MenuItem>)}
        </TextField>
        <Button variant="outlined" color="secondary" onClick={() => setFilters(EMPTY_FILTERS)}>
          Clear Filters
        </Button>
        <Box sx={{ flexGrow: 1, display: { xs: 'none', md: 'block' } }} />
        <Button variant="contained" color="success" onClick={() => navigate('/add')}>
          + Add New Task
        </Button>
      </Stack>

      <Typography variant="h5" component="h2" sx={{ mb: 2 }}>
        Your Tasks ({tasks.length})
      </Typography>
      <Box sx={{ height: 560, width: '100%' }}>
        <DataGrid
          rows={tasks}
          columns={columns}
          loading={loading}
          showToolbar
          initialState={{
            sorting: { sortModel: [{ field: 'createdAt', sort: 'desc' }] },
            columns: { columnVisibilityModel: { updatedAt: false, completedAt: false } },
          }}
          slotProps={{
            toolbar: {
              csvOptions: { fileName: 'tasks', utf8WithBom: true },
              printOptions: { disableToolbarButton: true },
            },
          }}
        />
      </Box>

      {taskToEdit && (
        <EditTaskModal task={taskToEdit} onClose={closeEditModal} />
      )}
      <ConfirmDialog
        open={taskToDelete !== null}
        title="Delete task?"
        message={<>"{taskToDelete?.title}" will be permanently deleted. This cannot be undone.</>}
        confirmLabel="Delete"
        onConfirm={confirmDelete}
        onCancel={() => setTaskToDelete(null)}
      />
    </Box>
  );
};
