import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WeatherService } from '../weather/weather.service';
import { ChatMessageDto, ChatResponseDto } from './dto/chat.dto';
import { Config } from '../config/configuration';

interface OpenAIMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface OpenAIResponse {
  choices: Array<{
    delta: {
      content?: string;
    };
  }>;
}

@Injectable()
export class ChatService {
  private readonly logger = new Logger(ChatService.name);

  constructor(
    private readonly configService: ConfigService<Config>,
    private readonly weatherService: WeatherService,
  ) {}

  async processMessage(chatMessage: ChatMessageDto): Promise<ChatResponseDto> {
    const { message, businessLocation, businessName, businessType } = chatMessage;

    // Determine if weather information is needed
    const needsWeather = this.shouldIncludeWeather(message);

    let weatherInfo = null;
    let locationToUse = businessLocation || 'San Francisco, CA';

    if (needsWeather) {
      try {
        const weatherData = await this.weatherService.getWeather({ q: locationToUse });
        weatherInfo = {
          location: weatherData.location,
          tempF: weatherData.tempF,
          tempC: weatherData.tempC,
        };
        this.logger.debug(`Weather fetched for ${locationToUse}: ${weatherData.tempF}°F`);
      } catch (error) {
        this.logger.error(`Failed to fetch weather for ${locationToUse}: ${error.message}`);
      }
    }

    // Create system prompt based on available information
    const systemPrompt = this.createSystemPrompt(businessName, businessType, locationToUse, weatherInfo);

    // Generate response using OpenAI streaming API
    const response = await this.generateResponse(message, systemPrompt);

    return {
      response,
      weatherInfo,
      businessInfo: businessName ? {
        name: businessName,
        location: locationToUse,
        type: businessType || 'business',
      } : undefined,
    };
  }

  private shouldIncludeWeather(message: string): boolean {
    const weatherKeywords = [
      'weather', 'temperature', 'hot', 'cold', 'warm', 'cool',
      'sunny', 'rainy', 'cloudy', 'snow', 'storm', 'forecast',
      'outside', 'outdoor', 'patio', 'terrace', 'garden',
      '°F', '°C', 'degrees', 'fahrenheit', 'celsius'
    ];

    const lowerMessage = message.toLowerCase();
    return weatherKeywords.some(keyword => lowerMessage.includes(keyword));
  }

  private createSystemPrompt(
    businessName: string | undefined,
    businessType: string | undefined,
    location: string,
    weatherInfo: any
  ): string {
    let prompt = `You are a helpful assistant for a ${businessType || 'business'} located in ${location}. `;

    if (businessName) {
      prompt += `The business name is ${businessName}. `;
    }

    prompt += `Be friendly, professional, and helpful. Keep responses concise but informative. `;

    if (weatherInfo) {
      prompt += `\n\nCurrent weather information for ${location}:
- Temperature: ${weatherInfo.tempF}°F (${weatherInfo.tempC}°C)
- Location: ${weatherInfo.location}

If the user asks about weather, incorporate this information naturally into your response. `;
    }

    prompt += `\n\nIf you don't have specific information about something, be honest and suggest they contact the business directly.`;

    return prompt;
  }

  private async generateResponse(userMessage: string, systemPrompt: string): Promise<string> {
    const apiKey = this.configService.get('openApiKey');
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const messages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ];

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages,
          stream: false, // For simplicity, we'll use non-streaming first
          max_tokens: 500,
          temperature: 0.7,
        }),
      });

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.choices[0]?.message?.content || 'I apologize, but I couldn\'t generate a response at the moment.';
    } catch (error) {
      this.logger.error(`OpenAI API error: ${error.message}`);
      return 'I apologize, but I\'m having trouble processing your request right now. Please try again later.';
    }
  }

  async generateStreamingResponse(userMessage: string, systemPrompt: string): Promise<ReadableStream> {
    const apiKey = this.configService.get('openApiKey');
    if (!apiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const messages: OpenAIMessage[] = [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages,
        stream: true,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    return response.body as ReadableStream;
  }
}
