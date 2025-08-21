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
      body: JSON.stringify({ message, conversationId }),
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
      // First try the regular endpoint for now
      const response = await this.sendMessage(message, conversationId || undefined);

      // Simulate streaming by sending the response in chunks
      const words = response.response.split(' ');
      for (let i = 0; i < words.length; i++) {
        onChunk(words[i] + (i < words.length - 1 ? ' ' : ''));
        await new Promise(resolve => setTimeout(resolve, 50)); // 50ms delay between words
      }

      onComplete(response.conversationId);
    } catch (error) {
      console.error('API Error:', error);
      onError(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  static async checkHealth(): Promise<{ ok: boolean }> {
    return this.makeRequest<{ ok: boolean }>('/health');
  }
}
