import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ChatService } from './chat.service';
import { WeatherService } from '../weather/weather.service';
import { RagService } from '../common/rag/rag.service';
import { DatabaseService } from '../database/database.service';

// Mock global fetch
global.fetch = jest.fn();

describe('ChatService RAG Integration', () => {
  let service: ChatService;
  let ragService: jest.Mocked<RagService>;
  let weatherService: jest.Mocked<WeatherService>;
  let configService: jest.Mocked<ConfigService>;
  let databaseService: jest.Mocked<DatabaseService>;

  const mockRagChunks = [
    {
      type: 'policies',
      content: 'reservations: First-come, first-serve; no reservations. pets: Dog-friendly patio',
      keywords: ['reservations', 'pets']
    }
  ];

  beforeEach(async () => {
    // Create mocks
    const mockRagService = {
      retrieveRelevantChunks: jest.fn(),
      formatChunksForPrompt: jest.fn(),
      getBusinessInfo: jest.fn(),
    };

    const mockWeatherService = {
      getWeather: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const mockDatabaseService = {
      createConversation: jest.fn().mockResolvedValue({ id: 'test-conversation-id' }),
      addMessage: jest.fn().mockResolvedValue({}),
      getConversationHistory: jest.fn().mockResolvedValue([]),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
        {
          provide: WeatherService,
          useValue: mockWeatherService,
        },
        {
          provide: RagService,
          useValue: mockRagService,
        },
        {
          provide: DatabaseService,
          useValue: mockDatabaseService,
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    ragService = module.get(RagService);
    weatherService = module.get(WeatherService);
    configService = module.get(ConfigService);
    databaseService = module.get(DatabaseService);

    // Setup default mocks
    configService.get.mockReturnValue('mock-api-key');
    ragService.retrieveRelevantChunks.mockReturnValue(mockRagChunks);
    ragService.formatChunksForPrompt.mockReturnValue('\n\nBusiness Information:\nPOLICIES: reservations: First-come, first-serve; no reservations. pets: Dog-friendly patio');

    // Mock successful OpenAI response
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: 'The Cellar operates on a first-come, first-serve basis and does not take reservations.'
            }
          }
        ]
      })
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('RAG Integration', () => {
    it('should retrieve relevant chunks for reservation queries', async () => {
      const chatMessage = {
        message: 'Do you take reservations?',
        businessName: 'The Cellar',
        businessType: 'wine_bar_cafe',
        businessLocation: 'San Clemente, CA'
      };

      await service.processMessage(chatMessage);

      expect(ragService.retrieveRelevantChunks).toHaveBeenCalledWith('Do you take reservations?');
      expect(ragService.formatChunksForPrompt).toHaveBeenCalledWith(mockRagChunks);
    });

    it('should include business context in system prompt', async () => {
      const chatMessage = {
        message: 'Do you take reservations?',
        businessName: 'The Cellar',
        businessType: 'wine_bar_cafe',
        businessLocation: 'San Clemente, CA'
      };

      await service.processMessage(chatMessage);

      // Check that fetch was called with the correct system prompt
      expect(global.fetch).toHaveBeenCalledWith(
        'https://api.openai.com/v1/chat/completions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer mock-api-key',
            'Content-Type': 'application/json',
          }),
          body: expect.stringContaining('Business Information')
        })
      );

      // Parse the request body to check the system prompt
      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      const systemMessage = requestBody.messages[0];

      expect(systemMessage.role).toBe('system');
      expect(systemMessage.content).toContain('Business Information:');
      expect(systemMessage.content).toContain('POLICIES: reservations: First-come, first-serve; no reservations');
    });

    it('should handle business queries without weather', async () => {
      const chatMessage = {
        message: 'Are dogs allowed?',
        businessName: 'The Cellar',
        businessType: 'wine_bar_cafe',
        businessLocation: 'San Clemente, CA'
      };

      const result = await service.processMessage(chatMessage);

      expect(ragService.retrieveRelevantChunks).toHaveBeenCalledWith('Are dogs allowed?');
      expect(weatherService.getWeather).not.toHaveBeenCalled();
      expect(result.weatherInfo).toBeNull();
    });

    it('should handle weather queries with RAG context', async () => {
      const chatMessage = {
        message: 'What is the weather like for the patio?',
        businessName: 'The Cellar',
        businessType: 'wine_bar_cafe',
        businessLocation: 'San Clemente, CA'
      };

      const mockWeatherData = {
        location: 'San Clemente, CA',
        tempF: 75,
        tempC: 24,
        provider: 'tomorrow.io' as const
      };

      weatherService.getWeather.mockResolvedValue(mockWeatherData);

      const result = await service.processMessage(chatMessage);

      expect(ragService.retrieveRelevantChunks).toHaveBeenCalledWith('What is the weather like for the patio?');
      expect(weatherService.getWeather).toHaveBeenCalledWith({ q: 'San Clemente, CA' });
      expect(result.weatherInfo).toEqual({
        location: 'San Clemente, CA',
        tempF: 75,
        tempC: 24
      });
    });

    it('should handle empty RAG results gracefully', async () => {
      ragService.retrieveRelevantChunks.mockReturnValue([]);
      ragService.formatChunksForPrompt.mockReturnValue('');

      const chatMessage = {
        message: 'What is quantum physics?',
        businessName: 'The Cellar',
        businessType: 'wine_bar_cafe',
        businessLocation: 'San Clemente, CA'
      };

      await service.processMessage(chatMessage);

      expect(ragService.retrieveRelevantChunks).toHaveBeenCalledWith('What is quantum physics?');
      expect(ragService.formatChunksForPrompt).toHaveBeenCalledWith([]);

      // Should still call OpenAI but without business context
      expect(global.fetch).toHaveBeenCalled();
    });

    it('should handle OpenAI API errors gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error'
      });

      const chatMessage = {
        message: 'Do you take reservations?',
        businessName: 'The Cellar',
        businessType: 'wine_bar_cafe',
        businessLocation: 'San Clemente, CA'
      };

      const result = await service.processMessage(chatMessage);

      expect(result.response).toContain('having trouble processing');
    });
  });

  describe('System Prompt Generation', () => {
    it('should create restrictive prompt with RAG context', async () => {
      const chatMessage = {
        message: 'Tell me about reservations',
        businessName: 'The Cellar',
        businessType: 'wine_bar_cafe',
        businessLocation: 'San Clemente, CA'
      };

      await service.processMessage(chatMessage);

      const fetchCall = (global.fetch as jest.Mock).mock.calls[0];
      const requestBody = JSON.parse(fetchCall[1].body);
      const systemPrompt = requestBody.messages[0].content;

      expect(systemPrompt).toContain('Answer ONLY using the business-info.yaml file');
      expect(systemPrompt).toContain('Never guess or use other sources');
      expect(systemPrompt).toContain('Keep replies ≤2 short sentences');
      expect(systemPrompt).toContain('Business Information:');
    });
  });
});
