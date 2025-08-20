import React from 'react';
import { AppBar, Toolbar, Typography, Box, Chip } from '@mui/material';
import { FiberManualRecord, LocalBar, Restaurant } from '@mui/icons-material';
import { useChatStore } from '../store/chatStore';

export const ChatHeader: React.FC = () => {
  const online = useChatStore((state) => state.online);

  return (
    <AppBar position="sticky" elevation={1} sx={{ backgroundColor: '#7B2C2F' }}>
      <Toolbar sx={{ justifyContent: 'space-between' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Restaurant sx={{ color: '#FFFFFF', fontSize: '24px' }} />
          <Typography variant="h6" component="h1" sx={{ fontWeight: 500, color: '#FFFFFF' }}>
            The Cellar • San Clemente
          </Typography>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FiberManualRecord
            sx={{
              fontSize: '12px',
              color: online ? '#4CAF50' : '#FFCDD2',
            }}
          />
          <Typography variant="body2" sx={{ color: '#FFFFFF', fontWeight: 500 }}>
            {online ? 'Online' : 'Offline'}
          </Typography>
        </Box>
      </Toolbar>
    </AppBar>
  );
};
