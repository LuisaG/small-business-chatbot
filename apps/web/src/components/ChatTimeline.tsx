import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';
import { ChatMessage } from './ChatMessage';
import { useChatStore } from '../store/chatStore';

export const ChatTimeline: React.FC = () => {
  const { messages, hasGreeted, sendMessage, setHasGreeted } = useChatStore();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Auto-send greeting on first load
    if (!hasGreeted) {
      setTimeout(() => {
        const greetingMessage = {
          id: `greeting-${Date.now()}`,
          role: 'assistant' as const,
          content: "Hi! You're in the right place. Ask me about hours, menu highlights, patio, or today’s weather.",
          status: 'done' as const,
          timestamp: new Date(),
        };

        useChatStore.setState((state) => ({
          messages: [greetingMessage],
          hasGreeted: true,
        }));
      }, 500);
    }
  }, [hasGreeted]);

  return (
    <Box
      sx={{
        flex: 1,
        overflow: 'auto',
        backgroundColor: '#FAF7F2',
        paddingY: '16px',
        paddingX: '8px',
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </Box>
    </Box>
  );
};
