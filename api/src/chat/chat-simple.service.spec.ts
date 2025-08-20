import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ChatSimpleService } from './chat-simple.service';
import { ChatService } from './chat.service';
import { RouterService } from '../router/router.service';
import { ChatSimpleInputDto } from './dto/chat-simple.dto';

describe('ChatSimpleService', () => {
  let service: ChatSimpleService;
  let chatService: jest.Mocked<ChatService>;
  let routerService: jest.Mocked<RouterService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const mockChatService = {
      processMessage: jest.fn(),
      generateStreamingResponse: jest.fn(),
      weatherService: {
        getWeather: jest.fn(),
      },
      createSystemPrompt: jest.fn(),
    };

    const mockRouterService = {
      routeMessage: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatSimpleService,
        {
          provide: ChatService,
          useValue: mockChatService,
        },
        {
          provide: RouterService,
          useValue: mockRouterService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<ChatSimpleService>(ChatSimpleService);
    chatService = module.get(ChatService);
    routerService = module.get(RouterService);
    configService = module.get(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processMessage', () => {
    it('should process weather queries correctly', async () => {
      const routerResult = {
        route: 'weather' as const,
        location: { type: 'business_id' as const, value: 'cellar-sc' },
        timeframe: 'now',
        business_facets: [],
      };

      const chatResult = {
        response: 'It is currently 72°F in San Clemente.',
        weatherInfo: {
          location: 'San Clemente, CA',
          tempF: 72,
          tempC: 22,
        },
        businessInfo: {
          name: 'The Cellar',
          location: 'San Clemente, CA',
          type: 'wine_bar_cafe',
        },
      };

      routerService.routeMessage.mockResolvedValue(routerResult);
      chatService.processMessage.mockResolvedValue(chatResult);

      const input: ChatSimpleInputDto = {
        message: 'What is the weather like today?',
      };

      const result = await service.processMessage(input);

      expect(routerService.routeMessage).toHaveBeenCalledWith({
        message: 'What is the weather like today?',
        businessId: 'cellar-sc',
      });

      expect(chatService.processMessage).toHaveBeenCalledWith({
        message: 'What is the weather like today?',
        businessName: 'The Cellar',
        businessType: 'wine_bar_cafe',
        businessLocation: 'San Clemente, CA',
      });

      expect(result.route).toBe('weather');
      expect(result.response).toBe('It is currently 72°F in San Clemente.');
      expect(result.weatherInfo).toBeDefined();
      expect(result.businessInfo).toBeDefined();
    });

    it('should process business queries correctly', async () => {
      const routerResult = {
        route: 'business' as const,
        location: { type: 'business_id' as const, value: 'cellar-sc' },
        timeframe: 'now',
        business_facets: ['hours'],
      };

      const chatResult = {
        response: 'We are open from 11:00 AM to 10:00 PM on weekdays.',
        weatherInfo: null,
        businessInfo: {
          name: 'The Cellar',
          location: 'San Clemente, CA',
          type: 'wine_bar_cafe',
        },
      };

      routerService.routeMessage.mockResolvedValue(routerResult);
      chatService.processMessage.mockResolvedValue(chatResult);

      const input: ChatSimpleInputDto = {
        message: 'What are your hours?',
      };

      const result = await service.processMessage(input);

      expect(result.route).toBe('business');
      expect(result.business_facets).toContain('hours');
      expect(result.response).toBe('We are open from 11:00 AM to 10:00 PM on weekdays.');
    });

    it('should process combined queries correctly', async () => {
      const routerResult = {
        route: 'both' as const,
        location: { type: 'business_id' as const, value: 'cellar-sc' },
        timeframe: 'now',
        business_facets: ['menu', 'patio'],
      };

      const chatResult = {
        response: 'We have outdoor seating and it is currently 75°F.',
        weatherInfo: {
          location: 'San Clemente, CA',
          tempF: 75,
          tempC: 24,
        },
        businessInfo: {
          name: 'The Cellar',
          location: 'San Clemente, CA',
          type: 'wine_bar_cafe',
        },
      };

      routerService.routeMessage.mockResolvedValue(routerResult);
      chatService.processMessage.mockResolvedValue(chatResult);

      const input: ChatSimpleInputDto = {
        message: 'Do you have outdoor seating and what is the weather?',
      };

      const result = await service.processMessage(input);

      expect(result.route).toBe('both');
      expect(result.business_facets).toContain('menu');
      expect(result.business_facets).toContain('patio');
      expect(result.weatherInfo).toBeDefined();
    });
  });
});
