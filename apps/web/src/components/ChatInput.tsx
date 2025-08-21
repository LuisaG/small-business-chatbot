import React, { useState } from 'react';
import { Box, TextField, Button, InputAdornment, CircularProgress } from '@mui/material';
import { Send } from '@mui/icons-material';
import { useChatStore } from '../store/chatStore';

export const ChatInput: React.FC = () => {
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const sendMessage = useChatStore((state) => state.sendMessage);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !isLoading) {
      const currentMessage = message.trim();
      setMessage(''); // Clear input immediately
      setIsLoading(true);
      try {
        await sendMessage(currentMessage);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{
        position: 'sticky',
        bottom: 0,
        backgroundColor: '#FAF7F2',
        padding: '16px',
        borderTop: '1px solid #E6E2DA',
        display: 'flex',
        gap: '12px',
        alignItems: 'flex-end',
      }}
    >
      <TextField
        fullWidth
        multiline
        maxRows={4}
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder='Ask anything… e.g., "Sunday hours", "Menu highlights", or "Weather tonight"'
        variant="outlined"
        sx={{
          flex: 1,
          '& .MuiInputBase-root': {
            backgroundColor: '#FFFFFF',
          },
        }}
      />
      <Button
        type="submit"
        variant="contained"
        disabled={!message.trim() || isLoading}
        sx={{
          minWidth: '56px',
          height: '56px',
          borderRadius: '12px',
          backgroundColor: '#7B2C2F',
          '&:hover': {
            backgroundColor: '#6B252A',
          },
          '&:disabled': {
            backgroundColor: '#E6E2DA',
            color: '#5B6770',
          },
        }}
      >
        {isLoading ? <CircularProgress size={24} color="inherit" /> : <Send />}
      </Button>
    </Box>
  );
};
