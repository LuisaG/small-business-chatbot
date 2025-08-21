import { Injectable, Logger } from '@nestjs/common';
import { ChatService } from './chat.service';
import { RouterService } from '../router/router.service';
import { ChatSimpleInputDto, ChatSimpleResponseDto } from './dto/chat-simple.dto';

@Injectable()
export class ChatSimpleService {
  private readonly logger = new Logger(ChatSimpleService.name);

  // Hardcoded business information for The Cellar
  private readonly CELLAR_INFO = {
    businessName: 'The Cellar',
    businessType: 'wine_bar_cafe',
    businessLocation: 'San Clemente, CA',
    businessId: 'cellar-sc',
  };

  constructor(
    private readonly chatService: ChatService,
    private readonly routerService: RouterService,
  ) {}

  async processMessage(input: ChatSimpleInputDto): Promise<ChatSimpleResponseDto> {
    const { message, conversationId } = input;

    // First, route the message to determine what type of query it is
    const routerResult = await this.routerService.routeMessage({
      message,
      businessId: this.CELLAR_INFO.businessId,
    });

    this.logger.debug(`Routed message to: ${routerResult.route} with facets: ${routerResult.business_facets.join(', ')}`);

    // Process the message with the chat service using The Cellar's information
    const chatResult = await this.chatService.processMessage({
      message,
      businessName: this.CELLAR_INFO.businessName,
      businessType: this.CELLAR_INFO.businessType,
      businessLocation: this.CELLAR_INFO.businessLocation,
      conversationId,
    });

    // Return the simplified response with routing information
    return {
      response: chatResult.response,
      weatherInfo: chatResult.weatherInfo,
      businessInfo: chatResult.businessInfo,
      route: routerResult.route,
      business_facets: routerResult.business_facets,
    };
  }

  async processStreamingMessage(input: ChatSimpleInputDto): Promise<ReadableStream> {
    const { message } = input;

    // Route the message first
    const routerResult = await this.routerService.routeMessage({
      message,
      businessId: this.CELLAR_INFO.businessId,
    });

    // Determine if weather information is needed
    const needsWeather = routerResult.route === 'weather' || routerResult.route === 'both';

    let weatherInfo = null;

    if (needsWeather) {
      try {
        const weatherData = await this.chatService['weatherService'].getWeather({
          q: this.CELLAR_INFO.businessLocation
        });
        weatherInfo = {
          location: weatherData.location,
          tempF: weatherData.tempF,
          tempC: weatherData.tempC,
        };
      } catch (error) {
        this.logger.error(`Failed to fetch weather: ${error.message}`);
      }
    }

    // Retrieve relevant business information using RAG
    const relevantChunks = this.chatService['ragService'].retrieveRelevantChunks(message);
    const businessContext = this.chatService['ragService'].formatChunksForPrompt(relevantChunks);

    // Create system prompt
    const systemPrompt = this.chatService['createSystemPrompt'](
      this.CELLAR_INFO.businessName,
      this.CELLAR_INFO.businessType,
      this.CELLAR_INFO.businessLocation,
      weatherInfo,
      businessContext
    );

    // Generate streaming response
    return this.chatService.generateStreamingResponse(message, systemPrompt);
  }
}
