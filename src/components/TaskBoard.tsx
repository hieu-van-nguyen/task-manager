import React, { useMemo, useState } from 'react';
import {
  alpha, Box, Card, CardActions, CardContent, Chip, IconButton, Paper, Stack, Tooltip, Typography,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { STATUS_LABELS, Task, TASK_STATUSES, TaskStatus } from '../types/Task';
import { getDueState } from '../utils/dates';
import { sortForBoard } from '../utils/filterTasks';
import { DueDateChip, PriorityChip, SubtaskProgress } from './TaskBadges';

const DRAG_TYPE = 'application/x-task-id';

interface TaskBoardProps {
  tasks: Task[];
  onEdit: (task: Task) => void;
  onDelete: (tasks: Task[]) => void;
  onStatusChange: (task: Task, status: TaskStatus) => void;
}

/**
 * Kanban board with one column per status. Cards can be dragged between columns
 * (HTML5 drag and drop) or moved with the arrow buttons (touch / keyboard).
 */
export const TaskBoard: React.FC<TaskBoardProps> = ({ tasks, onEdit, onDelete, onStatusChange }) => {
  const [dragOver, setDragOver] = useState<TaskStatus | null>(null);

  const columns = useMemo(
    () => TASK_STATUSES.map(status => ({ status, tasks: sortForBoard(tasks.filter(t => t.status === status)) })),
    [tasks]
  );

  const handleDrop = (e: React.DragEvent, status: TaskStatus) => {
    e.preventDefault();
    setDragOver(null);
    const id = e.dataTransfer.getData(DRAG_TYPE);
    const task = tasks.find(t => t.id === id);
    if (task && task.status !== status) onStatusChange(task, status);
  };

  return (
    <Box
      sx={{
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' },
        gap: 2,
        alignItems: 'start',
      }}
    >
      {columns.map(({ status, tasks: columnTasks }, columnIndex) => (
        <Paper
          key={status}
          variant="outlined"
          component="section"
          aria-label={`${STATUS_LABELS[status]} column`}
          onDragOver={(e) => {
            if (!e.dataTransfer.types.includes(DRAG_TYPE)) return;
            e.preventDefault(); // allow drop
            e.dataTransfer.dropEffect = 'move';
            if (dragOver !== status) setDragOver(status);
          }}
          onDragLeave={(e) => {
            // Ignore leave events fired when moving over child elements.
            if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(null);
          }}
          onDrop={(e) => handleDrop(e, status)}
          sx={(theme) => ({
            p: 1.5,
            minHeight: 200,
            bgcolor: dragOver === status ? alpha(theme.palette.primary.main, 0.08) : 'action.hover',
            borderColor: dragOver === status ? 'primary.main' : 'divider',
            borderStyle: dragOver === status ? 'dashed' : 'solid',
            transition: 'background-color 0.15s',
          })}
        >
          <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5, px: 0.5 }}>
            <Typography variant="subtitle1" component="h3" fontWeight={600}>
              {STATUS_LABELS[status]}
            </Typography>
            <Chip size="small" label={columnTasks.length} />
          </Stack>

          <Stack spacing={1.5}>
            {columnTasks.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 3 }}>
                Drop tasks here
              </Typography>
            )}
            {columnTasks.map(task => {
              const due = getDueState(task);
              const prev = TASK_STATUSES[columnIndex - 1];
              const next = TASK_STATUSES[columnIndex + 1];
              return (
                <Card
                  key={task.id}
                  draggable
                  onDragStart={(e) => {
                    e.dataTransfer.setData(DRAG_TYPE, task.id);
                    e.dataTransfer.effectAllowed = 'move';
                  }}
                  onDragEnd={() => setDragOver(null)}
                  sx={{
                    cursor: 'grab',
                    '&:active': { cursor: 'grabbing' },
                    borderLeft: 4,
                    borderLeftColor: due === 'overdue' ? 'error.main' : due === 'today' ? 'warning.main' : 'transparent',
                  }}
                >
                  <CardContent sx={{ pb: 1 }}>
                    <Typography
                      fontWeight={600}
                      sx={{
                        wordBreak: 'break-word',
                        textDecoration: task.status === 'completed' ? 'line-through' : 'none',
                        color: task.status === 'completed' ? 'text.secondary' : 'text.primary',
                      }}
                    >
                      {task.title}
                    </Typography>
                    {task.description && (
                      <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ mt: 0.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
                      >
                        {task.description}
                      </Typography>
                    )}
                    <Stack direction="row" spacing={0.5} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
                      <PriorityChip priority={task.priority} />
                      <Chip size="small" variant="outlined" label={task.category} />
                      <DueDateChip task={task} />
                      <SubtaskProgress subtasks={task.subtasks} />
                    </Stack>
                  </CardContent>
                  <CardActions sx={{ pt: 0, justifyContent: 'space-between' }}>
                    <Box>
                      {prev && (
                        <Tooltip title={`Move to ${STATUS_LABELS[prev]}`}>
                          <IconButton size="small" onClick={() => onStatusChange(task, prev)} aria-label={`Move "${task.title}" to ${STATUS_LABELS[prev]}`}>
                            <ArrowBackIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      {next && (
                        <Tooltip title={`Move to ${STATUS_LABELS[next]}`}>
                          <IconButton size="small" onClick={() => onStatusChange(task, next)} aria-label={`Move "${task.title}" to ${STATUS_LABELS[next]}`}>
                            <ArrowForwardIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                    <Box>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => onEdit(task)} aria-label={`Edit "${task.title}"`}>
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => onDelete([task])} aria-label={`Delete "${task.title}"`}>
                          <DeleteOutlineIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </CardActions>
                </Card>
              );
            })}
          </Stack>
        </Paper>
      ))}
    </Box>
  );
};
