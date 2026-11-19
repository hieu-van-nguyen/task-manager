import React, { useMemo } from 'react';
import { Box, LinearProgress, Paper, Stack, Typography } from '@mui/material';
import { PRIORITY_LABELS, STATUS_LABELS, Task, TASK_PRIORITIES, TASK_STATUSES } from '../types/Task';
import { computeStats } from '../utils/stats';

const StatCard: React.FC<{ label: string; value: number; color?: string; hint?: string }> = ({
  label, value, color = 'text.primary', hint,
}) => (
  <Paper variant="outlined" sx={{ p: 2 }}>
    <Typography variant="body2" color="text.secondary">{label}</Typography>
    <Typography variant="h4" component="p" fontWeight={700} sx={{ color }}>{value}</Typography>
    {hint && <Typography variant="caption" color="text.secondary">{hint}</Typography>}
  </Paper>
);

/** A labelled horizontal bar: "label .... count", bar = count / max. */
const BarRow: React.FC<{ label: string; value: number; max: number; detail?: string }> = ({ label, value, max, detail }) => (
  <Box>
    <Stack direction="row" justifyContent="space-between">
      <Typography variant="body2">{label}</Typography>
      <Typography variant="body2" color="text.secondary">{detail ?? value}</Typography>
    </Stack>
    <LinearProgress
      variant="determinate"
      value={max ? (value / max) * 100 : 0}
      sx={{ height: 8, borderRadius: 1, mt: 0.5 }}
      aria-label={`${label}: ${detail ?? value}`}
    />
  </Box>
);

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <Paper variant="outlined" sx={{ p: 2 }}>
    <Typography variant="subtitle1" component="h3" fontWeight={600} sx={{ mb: 1.5 }}>{title}</Typography>
    <Stack spacing={1.5}>{children}</Stack>
  </Paper>
);

/** Overview of all tasks (ignores the list filters). */
export const TaskDashboard: React.FC<{ tasks: Task[] }> = ({ tasks }) => {
  const stats = useMemo(() => computeStats(tasks), [tasks]);
  const maxPriority = Math.max(...Object.values(stats.openByPriority), 0);

  if (stats.total === 0) {
    return <Typography color="text.secondary">No tasks yet. Add one to see your stats.</Typography>;
  }

  return (
    <Stack spacing={2}>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr 1fr', md: 'repeat(4, 1fr)' } }}>
        <StatCard label="Open tasks" value={stats.open} hint={`${stats.total} total`} />
        <StatCard label="Due today" value={stats.dueToday} color={stats.dueToday ? 'warning.main' : undefined} />
        <StatCard label="Overdue" value={stats.overdue} color={stats.overdue ? 'error.main' : undefined} />
        <StatCard label="Completed this week" value={stats.completedThisWeek} color="success.main" hint="Since Monday" />
      </Box>
      <Box sx={{ display: 'grid', gap: 2, gridTemplateColumns: { xs: '1fr', md: 'repeat(3, 1fr)' } }}>
        <Section title="By status">
          {TASK_STATUSES.map(s => (
            <BarRow key={s} label={STATUS_LABELS[s]} value={stats.byStatus[s]} max={stats.total} />
          ))}
        </Section>
        <Section title="Open tasks by priority">
          {[...TASK_PRIORITIES].reverse().map(p => (
            <BarRow key={p} label={PRIORITY_LABELS[p]} value={stats.openByPriority[p]} max={maxPriority} />
          ))}
        </Section>
        <Section title="By category (completed / total)">
          {stats.byCategory.map(c => (
            <BarRow key={c.category} label={c.category} value={c.completed} max={c.total} detail={`${c.completed}/${c.total}`} />
          ))}
        </Section>
      </Box>
    </Stack>
  );
};
