import { create } from 'zustand';
import { ApiService } from '../lib/api';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  status: 'streaming' | 'done' | 'error';
  timestamp: Date;
}

interface ChatSlice {
  messages: Message[];
  hasGreeted: boolean;
  conversationId: string | null;
  sendMessage: (content: string) => void;
  appendPartial: (id: string, content: string) => void;
  finalizeMessage: (id: string) => void;
  clear: () => void;
  setHasGreeted: (value: boolean) => void;
  setConversationId: (id: string) => void;
}

interface UISlice {
  online: boolean;
  theme: 'light';
  setOnline: (value: boolean) => void;
}

interface MetricsSlice {
  messageCount: number;
  latencyMsLast: number;
  incrementMessageCount: () => void;
  setLatency: (ms: number) => void;
}

type ChatStore = ChatSlice & UISlice & MetricsSlice;

export const useChatStore = create<ChatStore>((set, get) => ({
  // Chat slice
  messages: [],
  hasGreeted: false,
  conversationId: null,
  sendMessage: async (content: string) => {
    const startTime = Date.now();

    const userMessage: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content,
      status: 'done',
      timestamp: new Date(),
    };

    const assistantMessage: Message = {
      id: `assistant-${Date.now()}`,
      role: 'assistant',
      content: '',
      status: 'streaming',
      timestamp: new Date(),
    };

    set((state) => ({
      messages: [...state.messages, userMessage, assistantMessage],
      messageCount: state.messageCount + 1,
    }));

    try {
      // Use streaming API for real-time response
      await ApiService.sendMessageStream(
        content,
        get().conversationId,
        (chunk: string) => {
          get().appendPartial(assistantMessage.id, chunk);
        },
        (conversationId: string) => {
          get().finalizeMessage(assistantMessage.id);
          get().setConversationId(conversationId);
          const latency = Date.now() - startTime;
          get().setLatency(latency);
        },
        (error: Error) => {
          console.error('API Error:', error);
          set((state) => ({
            messages: state.messages.map((msg) =>
              msg.id === assistantMessage.id
                ? { ...msg, content: 'Sorry, I encountered an error. Please try again.', status: 'error' as const }
                : msg
            ),
          }));
        }
      );
    } catch (error) {
      console.error('Failed to send message:', error);
      set((state) => ({
        messages: state.messages.map((msg) =>
          msg.id === assistantMessage.id
            ? { ...msg, content: 'Sorry, I encountered an error. Please try again.', status: 'error' as const }
            : msg
        ),
      }));
    }
  },
  appendPartial: (id: string, content: string) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, content: msg.content + content } : msg
      ),
    })),
  finalizeMessage: (id: string) =>
    set((state) => ({
      messages: state.messages.map((msg) =>
        msg.id === id ? { ...msg, status: 'done' as const } : msg
      ),
    })),
  clear: () => set({ messages: [], hasGreeted: false, conversationId: null }),
  setHasGreeted: (value: boolean) => set({ hasGreeted: value }),
  setConversationId: (id: string) => set({ conversationId: id }),

  // UI slice
  online: true,
  theme: 'light',
  setOnline: (value: boolean) => set({ online: value }),

  // Metrics slice
  messageCount: 0,
  latencyMsLast: 0,
  incrementMessageCount: () =>
    set((state) => ({ messageCount: state.messageCount + 1 })),
  setLatency: (ms: number) => set({ latencyMsLast: ms }),
}));
