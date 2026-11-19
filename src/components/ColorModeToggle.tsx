import React from 'react';
import { IconButton, Tooltip } from '@mui/material';
import { useColorScheme } from '@mui/material/styles';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';

/** Switches between light and dark mode. MUI persists the choice in localStorage. */
export const ColorModeToggle: React.FC = () => {
  const { mode, systemMode, setMode } = useColorScheme();
  if (!mode) return null; // Not resolved yet (first render)

  const effective = mode === 'system' ? systemMode : mode;
  const next = effective === 'dark' ? 'light' : 'dark';

  return (
    <Tooltip title={`Switch to ${next} mode`}>
      <IconButton color="inherit" onClick={() => setMode(next)} aria-label={`Switch to ${next} mode`}>
        {effective === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
      </IconButton>
    </Tooltip>
  );
};
