import React from 'react';
import { Box, Typography } from '@mui/material';
import { Message } from '../store/chatStore';
import { chatBubbleStyles } from '../theme/muiTheme';

interface ChatMessageProps {
  message: Message;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.role === 'user';
  
  const bubbleStyle = {
    ...chatBubbleStyles.common,
    ...(isUser ? chatBubbleStyles.user : chatBubbleStyles.assistant),
  };

  return (
    <Box sx={bubbleStyle}>
      <Typography
        variant="caption"
        sx={{
          color: '#5B6770',
          fontWeight: 500,
          marginBottom: '4px',
          display: 'block',
        }}
      >
        {isUser ? 'You' : 'Cellar Host'}
      </Typography>
      <Typography variant="body1" sx={{ lineHeight: 1.5 }}>
        {message.content}
        {message.status === 'streaming' && (
          <Box
            component="span"
            sx={{
              display: 'inline-block',
              width: '8px',
              height: '8px',
              backgroundColor: '#7B2C2F',
              borderRadius: '50%',
              marginLeft: '8px',
              animation: 'pulse 1.5s ease-in-out infinite',
              '@keyframes pulse': {
                '0%': {
                  opacity: 0.3,
                },
                '50%': {
                  opacity: 1,
                },
                '100%': {
                  opacity: 0.3,
                },
              },
            }}
          />
        )}
      </Typography>
    </Box>
  );
};