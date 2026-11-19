import React, { useMemo, useState } from 'react';
import {
  DataGrid, GridColDef, GridRenderCellParams, GridRowSelectionModel,
} from '@mui/x-data-grid';
import { alpha, Box, Button, MenuItem, Paper, Select, Stack, Typography } from '@mui/material';
import {
  PRIORITY_LABELS, PRIORITY_RANK, STATUS_LABELS, Task, TASK_PRIORITIES, TASK_STATUSES, TaskPriority, TaskStatus,
} from '../types/Task';
import { getDueState, parseLocalDate } from '../utils/dates';
import { DueDateChip, PriorityChip, SubtaskProgress } from './TaskBadges';

const STATUS_OPTIONS = TASK_STATUSES.map(value => ({ value, label: STATUS_LABELS[value] }));
const PRIORITY_OPTIONS = TASK_PRIORITIES.map(value => ({ value, label: PRIORITY_LABELS[value] }));
const EMPTY_SELECTION: GridRowSelectionModel = { type: 'include', ids: new Set() };

/** Firestore times are epoch ms; the grid's date columns need Date objects. */
const toDate = (value: number | null | undefined) => (value ? new Date(value) : null);

interface TaskTableProps {
  tasks: Task[];
  loading: boolean;
  onEdit: (task: Task) => void;
  onDelete: (tasks: Task[]) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
  onBulkStatusChange: (ids: string[], status: TaskStatus) => void;
}

export const TaskTable: React.FC<TaskTableProps> = ({
  tasks, loading, onEdit, onDelete, onStatusChange, onBulkStatusChange,
}) => {
  const [selection, setSelection] = useState<GridRowSelectionModel>(EMPTY_SELECTION);

  // Resolve the selection against current rows (handles "select all" exclude-mode and
  // rows that disappeared because of filters or deletes elsewhere).
  const selectedTasks = useMemo(
    () => tasks.filter(t => (selection.type === 'include' ? selection.ids.has(t.id) : !selection.ids.has(t.id))),
    [tasks, selection]
  );
  const selectedIds = selectedTasks.map(t => t.id);
  const clearSelection = () => setSelection(EMPTY_SELECTION);

  const bulkStatus = (status: TaskStatus) => {
    onBulkStatusChange(selectedIds, status);
    clearSelection();
  };

  const columns: GridColDef<Task>[] = [
    {
      field: 'title', headerName: 'Title', flex: 1, minWidth: 220,
    },
    {
      field: 'category', headerName: 'Category', width: 120,
    },
    {
      field: 'priority', headerName: 'Priority', width: 120,
      type: 'singleSelect', valueOptions: PRIORITY_OPTIONS,
      // Sort by importance (high > medium > low), not alphabetically.
      sortComparator: (a: TaskPriority, b: TaskPriority) => PRIORITY_RANK[a] - PRIORITY_RANK[b],
      renderCell: (params: GridRenderCellParams<Task, TaskPriority>) => <PriorityChip priority={params.row.priority} />,
    },
    {
      field: 'dueDate', headerName: 'Due', width: 190,
      type: 'date',
      valueGetter: (value: string | null) => (value ? parseLocalDate(value) : null),
      renderCell: (params: GridRenderCellParams<Task>) => <DueDateChip task={params.row} />,
    },
    {
      // Single status column: the value drives sorting/filtering/export,
      // the dropdown lets the user change it inline.
      field: 'status', headerName: 'Status', width: 150,
      type: 'singleSelect', valueOptions: STATUS_OPTIONS,
      renderCell: (params: GridRenderCellParams<Task, TaskStatus>) => (
        <Select
          value={params.row.status}
          size="small"
          variant="standard"
          disableUnderline
          fullWidth
          inputProps={{ 'aria-label': `Status for ${params.row.title}` }}
          onChange={(e) => onStatusChange(params.row, e.target.value as TaskStatus)}
          // Keep keyboard input in the dropdown instead of the grid's cell navigation.
          onKeyDown={(e) => e.stopPropagation()}
        >
          {STATUS_OPTIONS.map(o => <MenuItem key={o.value} value={o.value}>{o.label}</MenuItem>)}
        </Select>
      ),
    },
    {
      field: 'subtasks', headerName: 'Subtasks', width: 100,
      sortable: false, filterable: false,
      valueFormatter: (value: Task['subtasks']) =>
        value.length ? `${value.filter(s => s.done).length}/${value.length}` : '',
      renderCell: (params: GridRenderCellParams<Task>) => <SubtaskProgress subtasks={params.row.subtasks} />,
    },
    {
      field: 'description', headerName: 'Description', width: 250,
    },
    {
      field: 'createdAt', headerName: 'Created', width: 180,
      type: 'dateTime', valueGetter: toDate,
    },
    {
      field: 'updatedAt', headerName: 'Updated', width: 180,
      type: 'dateTime', valueGetter: toDate,
    },
    {
      field: 'completedAt', headerName: 'Completed', width: 180,
      type: 'dateTime', valueGetter: toDate,
    },
    {
      field: 'action', headerName: 'Actions', width: 170,
      sortable: false, filterable: false, disableColumnMenu: true, disableExport: true,
      renderCell: (params: GridRenderCellParams<Task>) => (
        <Stack direction="row" spacing={1} alignItems="center" sx={{ height: '100%' }}>
          <Button size="small" variant="outlined" onClick={() => onEdit(params.row)}>Edit</Button>
          <Button size="small" variant="outlined" color="error" onClick={() => onDelete([params.row])}>Delete</Button>
        </Stack>
      ),
    },
  ];

  return (
    <Box>
      {selectedTasks.length > 0 && (
        <Paper
          variant="outlined"
          sx={{ mb: 1, px: 2, py: 1, display: 'flex', flexWrap: 'wrap', gap: 1, alignItems: 'center' }}
        >
          <Typography sx={{ mr: 1 }}>{selectedTasks.length} selected</Typography>
          <Button size="small" variant="contained" color="success" onClick={() => bulkStatus('completed')}>
            Mark completed
          </Button>
          <Button size="small" variant="outlined" onClick={() => bulkStatus('started')}>Mark started</Button>
          <Button size="small" variant="outlined" onClick={() => bulkStatus('not started')}>Mark not started</Button>
          <Button
            size="small"
            variant="outlined"
            color="error"
            onClick={() => {
              onDelete(selectedTasks);
              clearSelection();
            }}
          >
            Delete
          </Button>
          <Box sx={{ flexGrow: 1 }} />
          <Button size="small" onClick={clearSelection}>Clear selection</Button>
        </Paper>
      )}
      <Box sx={{ height: 600, width: '100%' }}>
        <DataGrid
          rows={tasks}
          columns={columns}
          loading={loading}
          checkboxSelection
          disableRowSelectionOnClick
          rowSelectionModel={selection}
          onRowSelectionModelChange={setSelection}
          showToolbar
          getRowClassName={(params) => `task-row--${getDueState(params.row)}`}
          initialState={{
            sorting: { sortModel: [{ field: 'createdAt', sort: 'desc' }] },
            columns: { columnVisibilityModel: { description: false, updatedAt: false, completedAt: false } },
            pagination: { paginationModel: { pageSize: 25 } },
          }}
          pageSizeOptions={[10, 25, 50, 100]}
          slotProps={{
            toolbar: {
              // Search lives in the filter bar above (it also covers descriptions and the board view).
              showQuickFilter: false,
              csvOptions: { fileName: 'tasks', utf8WithBom: true },
              printOptions: { disableToolbarButton: true },
            },
          }}
          sx={(theme) => ({
            '& .task-row--overdue': { bgcolor: alpha(theme.palette.error.main, 0.08) },
            '& .task-row--today': { bgcolor: alpha(theme.palette.warning.main, 0.1) },
          })}
        />
      </Box>
    </Box>
  );
};
