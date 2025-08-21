import { Test, TestingModule } from '@nestjs/testing';
import { RouterService } from './router.service';
import { RouterInputDto } from './dto/router.dto';

describe('RouterService', () => {
  let service: RouterService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [RouterService],
    }).compile();

    service = module.get<RouterService>(RouterService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('routeMessage', () => {
    it('should route weather-only messages to weather', async () => {
      const input: RouterInputDto = {
        message: 'What is the weather like today?',
        businessId: 'cellar-sc',
      };

      const result = await service.routeMessage(input);

      expect(result.route).toBe('weather');
      expect(result.location).toEqual({
        type: 'business_id',
        value: 'cellar-sc',
      });
      expect(result.timeframe).toBe('now');
      expect(result.business_facets).toEqual([]);
    });

    it('should route business-only messages to business', async () => {
      const input: RouterInputDto = {
        message: 'What are your hours and do you have wifi?',
        businessId: 'cellar-sc',
      };

      const result = await service.routeMessage(input);

      expect(result.route).toBe('business');
      expect(result.location).toEqual({
        type: 'business_id',
        value: 'cellar-sc',
      });
      expect(result.business_facets).toContain('hours');
      expect(result.business_facets).toContain('wifi');
    });

    it('should route messages with both weather and business keywords to both', async () => {
      const input: RouterInputDto = {
        message: 'Is it sunny and do you have outdoor seating?',
        businessId: 'cellar-sc',
      };

      const result = await service.routeMessage(input);

      expect(result.route).toBe('both');
      expect(result.location).toEqual({
        type: 'business_id',
        value: 'cellar-sc',
      });
      expect(result.business_facets).toContain('patio');
    });

    it('should route messages without keywords to fallback', async () => {
      const input: RouterInputDto = {
        message: 'Hello, how are you?',
        businessId: 'cellar-sc',
      };

      const result = await service.routeMessage(input);

      expect(result.route).toBe('fallback');
      expect(result.location).toEqual({
        type: 'business_id',
        value: 'cellar-sc',
      });
      expect(result.business_facets).toEqual([]);
    });

    it('should extract timeframe correctly', async () => {
      const input: RouterInputDto = {
        message: 'What will the weather be like tomorrow?',
        businessId: 'cellar-sc',
      };

      const result = await service.routeMessage(input);

      expect(result.route).toBe('weather');
      expect(result.timeframe).toBe('relative:tomorrow');
    });

    it('should extract business facets correctly', async () => {
      const input: RouterInputDto = {
        message: 'Do you have dog-friendly seating and delivery options?',
        businessId: 'cellar-sc',
      };

      const result = await service.routeMessage(input);

      expect(result.route).toBe('business');
      expect(result.business_facets).toContain('dog');
      expect(result.business_facets).toContain('delivery');
      expect(result.business_facets).toContain('seating');
    });

    it('should infer businessId from message when not provided', async () => {
      const input: RouterInputDto = {
        message: 'What is the weather like at The Cellar?',
      };

      const result = await service.routeMessage(input);

      expect(result.location.value).toBe('cellar-sc');
    });

    it('should use default businessId when no business name is detected', async () => {
      const input: RouterInputDto = {
        message: 'What is the weather?',
      };

      const result = await service.routeMessage(input);

      expect(result.location.value).toBe('cellar-sc');
    });

    it('should infer different business IDs based on message content', async () => {
      const input: RouterInputDto = {
        message: 'What are the hours at Blue Bottle Coffee?',
      };

      const result = await service.routeMessage(input);

      expect(result.location.value).toBe('blue-bottle-sf');
      expect(result.route).toBe('business');
      expect(result.business_facets).toContain('hours');
    });

    it('should handle various weather keywords', async () => {
      const weatherKeywords = [
        'forecast', 'rain', 'temp', 'wind', 'humidity', 'sunny', 'cloudy',
        'hot', 'cold', 'storm', 'snow', 'fog', 'breeze'
      ];

      for (const keyword of weatherKeywords) {
        const input: RouterInputDto = {
          message: `What is the ${keyword} like?`,
          businessId: 'cellar-sc',
        };

        const result = await service.routeMessage(input);
        expect(result.route).toBe('weather');
      }
    });

    it('should handle various business keywords', async () => {
      const businessKeywords = [
        'hours', 'menu', 'wifi', 'seating', 'patio', 'reservation',
        'phone', 'address', 'parking', 'delivery'
      ];

      for (const keyword of businessKeywords) {
        const input: RouterInputDto = {
          message: `What about your ${keyword}?`,
          businessId: 'cellar-sc',
        };

        const result = await service.routeMessage(input);
        expect(result.route).toBe('business');
      }
    });

    describe('Specific Use Cases', () => {
      it('should route "What time do you open on Sunday?" to business with hours facet', async () => {
        const input: RouterInputDto = {
          message: 'What time do you open on Sunday?',
          businessId: 'cellar-sc',
        };

        const result = await service.routeMessage(input);

        expect(result.route).toBe('business');
        expect(result.location).toEqual({
          type: 'business_id',
          value: 'cellar-sc',
        });
        expect(result.timeframe).toBe('now');
        expect(result.business_facets).toContain('hours');
      });

      it('should route "Is it going to rain there tonight?" to weather with relative timeframe', async () => {
        const input: RouterInputDto = {
          message: 'Is it going to rain there tonight?',
          businessId: 'cellar-sc',
        };

        const result = await service.routeMessage(input);

        expect(result.route).toBe('weather');
        expect(result.location).toEqual({
          type: 'business_id',
          value: 'cellar-sc',
        });
        expect(result.timeframe).toBe('relative:tonight');
        expect(result.business_facets).toEqual([]);
      });

      it('should route "Do you have pastries and what\'s the weather right now?" to both', async () => {
        const input: RouterInputDto = {
          message: 'Do you have pastries and what\'s the weather right now?',
          businessId: 'cellar-sc',
        };

        const result = await service.routeMessage(input);

        expect(result.route).toBe('both');
        expect(result.location).toEqual({
          type: 'business_id',
          value: 'cellar-sc',
        });
        expect(result.timeframe).toBe('now');
        expect(result.business_facets).toContain('menu');
      });

      it('should route "Do you cater weddings?" to business with policies facet', async () => {
        const input: RouterInputDto = {
          message: 'Do you cater weddings?',
          businessId: 'cellar-sc',
        };

        const result = await service.routeMessage(input);

        expect(result.route).toBe('business');
        expect(result.location).toEqual({
          type: 'business_id',
          value: 'cellar-sc',
        });
        expect(result.timeframe).toBe('now');
        expect(result.business_facets).toContain('policy');
      });

      it('should route unclear message "Tell me more" to fallback', async () => {
        const input: RouterInputDto = {
          message: 'Tell me more',
          businessId: 'cellar-sc',
        };

        const result = await service.routeMessage(input);

        expect(result.route).toBe('fallback');
        expect(result.location).toEqual({
          type: 'business_id',
          value: 'cellar-sc',
        });
        expect(result.business_facets).toEqual([]);
      });

      it('should route "What\'s the weather like today?" to weather', async () => {
        const input: RouterInputDto = {
          message: 'What\'s the weather like today?',
          businessId: 'cellar-sc',
        };

        const result = await service.routeMessage(input);

        expect(result.route).toBe('weather');
        expect(result.timeframe).toBe('now');
        expect(result.business_facets).toEqual([]);
      });

      it('should route "Do you have outdoor seating?" to business with patio facet', async () => {
        const input: RouterInputDto = {
          message: 'Do you have outdoor seating?',
          businessId: 'cellar-sc',
        };

        const result = await service.routeMessage(input);

        expect(result.route).toBe('business');
        expect(result.business_facets).toContain('patio');
      });

      it('should route "Can I bring my dog?" to business with dog facet', async () => {
        const input: RouterInputDto = {
          message: 'Can I bring my dog?',
          businessId: 'cellar-sc',
        };

        const result = await service.routeMessage(input);

        expect(result.route).toBe('business');
        expect(result.business_facets).toContain('dog');
      });

      it('should route "What\'s your phone number?" to business with contact facet', async () => {
        const input: RouterInputDto = {
          message: 'What\'s your phone number?',
          businessId: 'cellar-sc',
        };

        const result = await service.routeMessage(input);

        expect(result.route).toBe('business');
        expect(result.business_facets).toContain('contact');
      });

      it('should route "Do you have wifi?" to business with wifi facet', async () => {
        const input: RouterInputDto = {
          message: 'Do you have wifi?',
          businessId: 'cellar-sc',
        };

        const result = await service.routeMessage(input);

        expect(result.route).toBe('business');
        expect(result.business_facets).toContain('wifi');
      });
    });
  });
});
