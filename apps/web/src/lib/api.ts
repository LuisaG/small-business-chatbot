const API_BASE_URL = 'http://localhost:3000';

export interface ChatSimpleResponse {
  response: string;
  conversationId: string;
  weatherInfo?: {
    location: string;
    tempF: number;
    tempC: number;
  };
  businessInfo?: {
    name: string;
    location: string;
    type: string;
  };
  route: 'weather' | 'business' | 'both' | 'fallback';
  business_facets: string[];
}

export interface ChatSimpleRequest {
  message: string;
  conversationId?: string;
}

export class ApiService {
  private static async makeRequest<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    console.log('Making API request to:', url);

    try {
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        ...options,
      });

      console.log('API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('API error response:', errorText);
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('API response data:', data);
      return data;
    } catch (error) {
      console.error('API request error:', error);
      throw error;
    }
  }

  static async sendMessage(message: string, conversationId?: string): Promise<ChatSimpleResponse> {
    return this.makeRequest<ChatSimpleResponse>('/chat-simple', {
      method: 'POST',
      body: JSON.stringify({
        message,
        ...(conversationId && { conversationId })
      }),
    });
  }

    static async sendMessageStream(
    message: string,
    conversationId: string | null,
    onChunk: (chunk: string) => void,
    onComplete: (conversationId: string) => void,
    onError: (error: Error) => void
  ): Promise<void> {
    try {
      const url = `${API_BASE_URL}/chat-simple/stream`;
      console.log('Making streaming API request to:', url);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message,
          ...(conversationId && { conversationId })
        }),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body reader available');
      }

      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value);
        console.log('Raw chunk received:', chunk);

        // The backend is sending raw text chunks, not SSE format
        // Just send the chunk directly to the UI
        if (chunk.trim()) {
          console.log('Sending chunk to UI:', chunk);
          onChunk(chunk);
        }
      }

      // For now, we'll use a placeholder conversation ID since streaming doesn't return it
      onComplete('new-conversation');
    } catch (error) {
      console.error('API Error:', error);
      onError(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  static async checkHealth(): Promise<{ ok: boolean }> {
    return this.makeRequest<{ ok: boolean }>('/health');
  }
}
