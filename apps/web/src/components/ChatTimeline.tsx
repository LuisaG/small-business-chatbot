import React, { useEffect, useRef } from 'react';
import { Box, Container } from '@mui/material';
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
          content: "Welcome! I can help with hours, menu highlights, patio & pets, or check the weather at our location.",
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
        paddingX: '24px',
      }}
    >
      <Box sx={{ display: 'flex', flexDirection: 'column', maxWidth: '800px', margin: '0 auto' }}>
        {messages.map((message) => (
          <ChatMessage key={message.id} message={message} />
        ))}
        <div ref={messagesEndRef} />
      </Box>
    </Box>
  );
};
