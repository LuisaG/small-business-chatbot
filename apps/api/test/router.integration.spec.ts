import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { WeatherService } from '../src/weather/weather.service';
import { ConfigService } from '@nestjs/config';

describe('Router Integration (e2e)', () => {
  let app: INestApplication;
  let weatherService: jest.Mocked<WeatherService>;
  let configService: jest.Mocked<ConfigService>;

  beforeEach(async () => {
    const mockWeatherService = {
      getWeather: jest.fn(),
    };

    const mockConfigService = {
      get: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(WeatherService)
      .useValue(mockWeatherService)
      .overrideProvider(ConfigService)
      .useValue(mockConfigService)
      .compile();

    app = moduleFixture.createNestApplication();
    weatherService = moduleFixture.get(WeatherService);
    configService = moduleFixture.get(ConfigService);

    // Mock OpenAI API
    configService.get.mockReturnValue('test-openai-key');
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: jest.fn().mockResolvedValue({
        choices: [{ message: { content: 'Test response' } }],
      }),
    });

    await app.init();
  });

  describe('/router (POST)', () => {
    it('should route weather-only messages correctly', () => {
      return request(app.getHttpServer())
        .post('/router')
        .send({
          message: 'What is the weather like today?',
          businessId: 'cellar-sc',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.route).toBe('weather');
          expect(res.body.location).toEqual({
            type: 'business_id',
            value: 'cellar-sc',
          });
          expect(res.body.timeframe).toBe('now');
          expect(res.body.business_facets).toEqual([]);
        });
    });

    it('should route business-only messages correctly', () => {
      return request(app.getHttpServer())
        .post('/router')
        .send({
          message: 'What are your hours and do you have wifi?',
          businessId: 'cellar-sc',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.route).toBe('business');
          expect(res.body.location).toEqual({
            type: 'business_id',
            value: 'cellar-sc',
          });
          expect(res.body.business_facets).toContain('hours');
          expect(res.body.business_facets).toContain('wifi');
        });
    });

    it('should route both weather and business messages correctly', () => {
      return request(app.getHttpServer())
        .post('/router')
        .send({
          message: 'Is it sunny and do you have outdoor seating?',
          businessId: 'cellar-sc',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.route).toBe('both');
          expect(res.body.location).toEqual({
            type: 'business_id',
            value: 'cellar-sc',
          });
          expect(res.body.business_facets).toContain('patio');
        });
    });

    it('should route fallback for messages without keywords', () => {
      return request(app.getHttpServer())
        .post('/router')
        .send({
          message: 'Hello, how are you?',
          businessId: 'cellar-sc',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.route).toBe('fallback');
          expect(res.body.location).toEqual({
            type: 'business_id',
            value: 'cellar-sc',
          });
          expect(res.body.business_facets).toEqual([]);
        });
    });

    it('should use default businessId when not provided', () => {
      return request(app.getHttpServer())
        .post('/router')
        .send({
          message: 'What is the weather?',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.location.value).toBe('cellar-sc');
        });
    });

    it('should extract timeframe correctly', () => {
      return request(app.getHttpServer())
        .post('/router')
        .send({
          message: 'What will the weather be like tomorrow?',
          businessId: 'cellar-sc',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.route).toBe('weather');
          expect(res.body.timeframe).toBe('relative:tomorrow');
        });
    });

    it('should extract business facets correctly', () => {
      return request(app.getHttpServer())
        .post('/router')
        .send({
          message: 'Do you have dog-friendly seating and delivery options?',
          businessId: 'cellar-sc',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.route).toBe('business');
          expect(res.body.business_facets).toContain('dog');
          expect(res.body.business_facets).toContain('delivery');
          expect(res.body.business_facets).toContain('seating');
        });
    });

    describe('Specific Use Case Integration Tests', () => {
      it('should handle "What time do you open on Sunday?" correctly', () => {
        return request(app.getHttpServer())
          .post('/router')
          .send({
            message: 'What time do you open on Sunday?',
            businessId: 'cellar-sc',
          })
          .expect(201)
          .expect((res) => {
            expect(res.body.route).toBe('business');
            expect(res.body.timeframe).toBe('now');
            expect(res.body.business_facets).toContain('hours');
          });
      });

      it('should handle "Is it going to rain there tonight?" correctly', () => {
        return request(app.getHttpServer())
          .post('/router')
          .send({
            message: 'Is it going to rain there tonight?',
            businessId: 'cellar-sc',
          })
          .expect(201)
          .expect((res) => {
            expect(res.body.route).toBe('weather');
            expect(res.body.timeframe).toBe('relative:tonight');
            expect(res.body.business_facets).toEqual([]);
          });
      });

      it('should handle "Do you have pastries and what\'s the weather right now?" correctly', () => {
        return request(app.getHttpServer())
          .post('/router')
          .send({
            message: 'Do you have pastries and what\'s the weather right now?',
            businessId: 'cellar-sc',
          })
          .expect(201)
          .expect((res) => {
            expect(res.body.route).toBe('both');
            expect(res.body.timeframe).toBe('now');
            expect(res.body.business_facets).toContain('menu');
          });
      });

      it('should handle "Do you cater weddings?" correctly', () => {
        return request(app.getHttpServer())
          .post('/router')
          .send({
            message: 'Do you cater weddings?',
            businessId: 'cellar-sc',
          })
          .expect(201)
          .expect((res) => {
            expect(res.body.route).toBe('business');
            expect(res.body.timeframe).toBe('now');
            expect(res.body.business_facets).toContain('policy');
          });
      });

      it('should handle unclear message "Tell me more" correctly', () => {
        return request(app.getHttpServer())
          .post('/router')
          .send({
            message: 'Tell me more',
            businessId: 'cellar-sc',
          })
          .expect(201)
          .expect((res) => {
            expect(res.body.route).toBe('fallback');
            expect(res.body.business_facets).toEqual([]);
          });
      });
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
