import { createTheme } from '@mui/material/styles';

// Central place for colors, typography and component defaults.
export const theme = createTheme({
  palette: {
    primary: { main: '#1565c0' },
    secondary: { main: '#6c757d' },
    success: { main: '#2e7d32' },
    background: { default: '#f4f7f6', paper: '#ffffff' },
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
