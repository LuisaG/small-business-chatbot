import { Test, TestingModule } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { ChatService } from './chat.service';
import { WeatherService } from '../weather/weather.service';
import { ChatMessageDto } from './dto/chat.dto';

describe('ChatService', () => {
  let service: ChatService;
  let weatherService: jest.Mocked<WeatherService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const mockWeatherService = {
      getWeather: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: WeatherService,
          useValue: mockWeatherService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<ChatService>(ChatService);
    weatherService = module.get(WeatherService);
    configService = module.get(ConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('processMessage', () => {
    beforeEach(() => {
      configService.get.mockReturnValue('test-openai-key');
    });

    it('should call weather API when weather keywords are present', async () => {
      const mockWeatherData = {
        location: 'San Francisco, CA',
        lat: 37.7749,
        lon: -122.4194,
        tempC: 20,
        tempF: 68,
        conditionCode: '1000',
        provider: 'tomorrow.io' as const,
      };

      weatherService.getWeather.mockResolvedValue(mockWeatherData);

      // Mock fetch for OpenAI
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'It is currently 68°F in San Francisco.' } }],
        }),
      });

      const input: ChatMessageDto = {
        message: 'What is the weather like today?',
        businessLocation: 'San Francisco, CA',
      };

      const result = await service.processMessage(input);

      expect(weatherService.getWeather).toHaveBeenCalledWith({ q: 'San Francisco, CA' });
      expect(result.weatherInfo).toBeDefined();
      expect(result.weatherInfo.tempF).toBe(68);
      expect(result.weatherInfo.tempC).toBe(20);
    });

    it('should not call weather API when no weather keywords are present', async () => {
      // Mock fetch for OpenAI
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Our hours are 9 AM to 5 PM.' } }],
        }),
      });

      const input: ChatMessageDto = {
        message: 'What are your business hours?',
        businessLocation: 'San Francisco, CA',
      };

      const result = await service.processMessage(input);

      expect(weatherService.getWeather).not.toHaveBeenCalled();
      expect(result.weatherInfo).toBeNull();
    });

    it('should handle weather API errors gracefully', async () => {
      weatherService.getWeather.mockRejectedValue(new Error('Weather API error'));

      // Mock fetch for OpenAI
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'I cannot provide weather information right now.' } }],
        }),
      });

      const input: ChatMessageDto = {
        message: 'What is the weather like?',
        businessLocation: 'San Francisco, CA',
      };

      const result = await service.processMessage(input);

      expect(weatherService.getWeather).toHaveBeenCalled();
      expect(result.weatherInfo).toBeNull();
    });

    it('should include business info when business name is provided', async () => {
      // Mock fetch for OpenAI
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'Welcome to our coffee shop!' } }],
        }),
      });

      const input: ChatMessageDto = {
        message: 'Hello',
        businessName: 'Blue Bottle Coffee',
        businessType: 'coffee shop',
        businessLocation: 'San Francisco, CA',
      };

      const result = await service.processMessage(input);

      expect(result.businessInfo).toBeDefined();
      expect(result.businessInfo.name).toBe('Blue Bottle Coffee');
      expect(result.businessInfo.type).toBe('coffee shop');
      expect(result.businessInfo.location).toBe('San Francisco, CA');
    });

    it('should use default location when business location is not provided', async () => {
      const mockWeatherData = {
        location: 'San Francisco, CA',
        lat: 37.7749,
        lon: -122.4194,
        tempC: 20,
        tempF: 68,
        conditionCode: '1000',
        provider: 'tomorrow.io' as const,
      };

      weatherService.getWeather.mockResolvedValue(mockWeatherData);

      // Mock fetch for OpenAI
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: jest.fn().mockResolvedValue({
          choices: [{ message: { content: 'It is currently 68°F in San Francisco.' } }],
        }),
      });

      const input: ChatMessageDto = {
        message: 'What is the weather like?',
      };

      const result = await service.processMessage(input);

      expect(weatherService.getWeather).toHaveBeenCalledWith({ q: 'San Francisco, CA' });
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });
});
