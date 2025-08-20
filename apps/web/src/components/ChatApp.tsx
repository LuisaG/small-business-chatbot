import React from 'react';
import { ThemeProvider } from '@mui/material/styles';
import { CssBaseline, Box } from '@mui/material';
import { theme } from '../theme/muiTheme';
import { ChatHeader } from './ChatHeader';
import { ChatTimeline } from './ChatTimeline';
import { ChatInput } from './ChatInput';

export const ChatApp: React.FC = () => {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          height: '100vh',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: '#FAF7F2',
        }}
      >
        <ChatHeader />
        <ChatTimeline />
        <ChatInput />
      </Box>
    </ThemeProvider>
  );
};