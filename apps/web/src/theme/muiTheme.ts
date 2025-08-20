import { createTheme } from '@mui/material/styles';

export const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#7B2C2F', // burgundy
    },
    background: {
      default: '#FAF7F2', // ivory
      paper: '#FFFFFF', // surface
    },
    text: {
      primary: '#141414',
      secondary: '#5B6770',
    },
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen", "Ubuntu", "Cantarell", "Fira Sans", "Droid Sans", "Helvetica Neue", sans-serif',
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#FFFFFF',
          color: '#141414',
          boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            backgroundColor: '#FFFFFF',
            '& fieldset': {
              borderColor: '#E6E2DA',
            },
            '&:hover fieldset': {
              borderColor: '#7B2C2F',
            },
            '&.Mui-focused fieldset': {
              borderColor: '#7B2C2F',
            },
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 500,
        },
        contained: {
          backgroundColor: '#7B2C2F',
          color: '#FFFFFF',
          '&:hover': {
            backgroundColor: '#6B252A',
          },
        },
      },
    },
  },
});

export const chatBubbleStyles = {
  user: {
    backgroundColor: '#F2EEE6', // warm ivory
    color: '#141414',
    marginLeft: 'auto',
    marginRight: '16px',
  },
  assistant: {
    backgroundColor: '#FFF8F1', // very light peach
    color: '#141414',
    marginLeft: '0px',
    marginRight: 'auto',
  },
  common: {
    borderRadius: 4,
    border: '1px solid #E6E2DA',
    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
    maxWidth: '85%',
    padding: '12px 16px',
    marginBottom: '12px',
  },
};
