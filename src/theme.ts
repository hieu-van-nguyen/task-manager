import { createTheme } from '@mui/material/styles';

// Central place for colors, typography and component defaults.
// Light and dark palettes are both defined; the user's choice (or the OS
// preference, by default) is applied by MUI and remembered in localStorage.
// Use theme tokens (e.g. 'background.paper', 'action.hover', 'text.secondary')
// rather than fixed colors so components work in both modes.
export const theme = createTheme({
  cssVariables: { colorSchemeSelector: 'class' },
  colorSchemes: {
    light: {
      palette: {
        primary: { main: '#1565c0' },
        secondary: { main: '#6c757d' },
        success: { main: '#2e7d32' },
        background: { default: '#f4f7f6', paper: '#ffffff' },
      },
    },
    dark: {
      palette: {
        primary: { main: '#90caf9' },
        secondary: { main: '#adb5bd' },
        success: { main: '#66bb6a' },
        background: { default: '#121212', paper: '#1e1e1e' },
      },
    },
  },
  shape: { borderRadius: 8 },
  typography: {
    fontFamily: [
      '-apple-system', 'BlinkMacSystemFont', '"Segoe UI"', 'Roboto', '"Helvetica Neue"', 'Arial', 'sans-serif',
    ].join(','),
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiButton: { defaultProps: { disableElevation: true } },
    MuiTextField: { defaultProps: { size: 'small' } },
  },
});
