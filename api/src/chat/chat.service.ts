import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WeatherService } from '../weather/weather.service';
import { RagService } from '../common/rag/rag.service';
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
    private readonly ragService: RagService,
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

    // Retrieve relevant business information using RAG
    const relevantChunks = this.ragService.retrieveRelevantChunks(message);
    const businessContext = this.ragService.formatChunksForPrompt(relevantChunks);

    // Create system prompt based on available information
    const systemPrompt = this.createSystemPrompt(businessName, businessType, locationToUse, weatherInfo, businessContext);

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
    weatherInfo: any,
    businessContext: string
  ): string {
    let prompt = `You are the assistant for ${businessName || 'The Cellar'}. Answer ONLY using the business-info.yaml file for business information. If business info is not in the file, say you don't have it and offer to connect them to the business. Never guess or use other sources.

Allowed topics: hours, menu highlights, patio & pets, weather (use weather API), contact/directions. Keep replies ≤2 short sentences. If out of scope or missing data: brief apology + offer to connect.`;

    if (weatherInfo) {
      prompt += `\n\nCurrent weather: ${weatherInfo.tempF}°F (${weatherInfo.tempC}°C) in ${weatherInfo.location}.`;
    }

    if (businessContext) {
      prompt += businessContext;
    }

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
          model: 'gpt-4.1-mini',
          messages,
          stream: false, // TODO: Luisa get back and use the actual stream option
          max_tokens: 500,
          temperature: 0.3,
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
        max_tokens: 250,
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status} ${response.statusText}`);
    }

    return response.body as ReadableStream;
  }
}
