import { Test, TestingModule } from '@nestjs/testing';
import { RagService } from './rag.service';
import * as fs from 'fs';
import * as yaml from 'js-yaml';

// Mock fs and yaml modules
jest.mock('fs');
jest.mock('js-yaml');

const mockFs = fs as jest.Mocked<typeof fs>;
const mockYaml = yaml as jest.Mocked<typeof yaml>;

describe('RagService', () => {
  let service: RagService;

  const mockBusinessInfo = {
    business: {
      id: 'cellar-sc',
      name: 'The Cellar',
      type: 'wine_bar_cafe',
      timezone: 'America/Los_Angeles',
      address: '156 Avenida Del Mar, San Clemente, CA 92672',
      contact: {
        phone: '(949) 492-3663',
        email: 'ask@thecellarsite.com',
        website: 'https://thecellarsite.com'
      }
    },
    hours: {
      regular: {
        tue: '11:00 AM – 10:00 PM',
        wed: '11:00 AM – 10:00 PM',
        thu: '11:00 AM – 10:00 PM',
        fri: '11:00 AM – 11:00 PM',
        sat: '10:00 AM – 11:00 PM',
        sun: '10:00 AM – 3:00 PM'
      },
      service_notes: {
        brunch: 'Sat & Sun 10:00 AM – 3:00 PM',
        lunch: 'Tue–Fri 11:00 AM – 3:00 PM',
        happy_hour: 'Tue–Fri 3:00 PM – 6:00 PM',
        dinner: 'Tue–Sun 5:00 PM – 9:00 PM'
      }
    },
    policies: {
      reservations: 'First-come, first-serve; no reservations',
      pets: 'Dog-friendly patio'
    },
    amenities: {
      music: 'Live music schedule (see site)'
    },
    meta: {
      last_updated: '2024-01-01',
      sources: ['business-info.yaml']
    }
  };

  beforeEach(async () => {
    // Reset mocks
    jest.clearAllMocks();

    // Mock file system before service instantiation
    mockFs.existsSync.mockReturnValue(true);
    mockFs.readFileSync.mockReturnValue('mock yaml content');
    mockYaml.load.mockReturnValue(mockBusinessInfo);

    const module: TestingModule = await Test.createTestingModule({
      providers: [RagService],
    }).compile();

    service = module.get<RagService>(RagService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should load business info from YAML file', () => {
    expect(mockFs.existsSync).toHaveBeenCalledWith(
      expect.stringContaining('knowledge/cellar-sc/business-info.yaml')
    );
    expect(mockFs.readFileSync).toHaveBeenCalledWith(
      expect.stringContaining('knowledge/cellar-sc/business-info.yaml'),
      'utf8'
    );
    expect(mockYaml.load).toHaveBeenCalledWith('mock yaml content');
  });

  it('should retrieve business info', () => {
    const businessInfo = service.getBusinessInfo();
    expect(businessInfo).toEqual(mockBusinessInfo);
  });

  describe('retrieveRelevantChunks', () => {
    it('should find reservation-related chunks', () => {
      const chunks = service.retrieveRelevantChunks('Do you take reservations?');

      expect(chunks.length).toBeGreaterThan(0);
      const policyChunk = chunks.find(chunk => chunk.type === 'policies');
      expect(policyChunk).toBeDefined();
      expect(policyChunk?.content).toContain('First-come, first-serve; no reservations');
    });

    it('should find hours-related chunks', () => {
      const chunks = service.retrieveRelevantChunks('What are your hours?');

      expect(chunks.length).toBeGreaterThan(0);
      const hoursChunk = chunks.find(chunk => chunk.type === 'hours');
      expect(hoursChunk).toBeDefined();
      expect(hoursChunk?.content).toContain('11:00 AM – 10:00 PM');
    });

    it('should find contact-related chunks', () => {
      const chunks = service.retrieveRelevantChunks('What is your phone number?');

      expect(chunks.length).toBeGreaterThan(0);
      const contactChunk = chunks.find(chunk => chunk.type === 'contact');
      expect(contactChunk).toBeDefined();
      expect(contactChunk?.content).toContain('(949) 492-3663');
    });

    it('should find pet policy chunks', () => {
      const chunks = service.retrieveRelevantChunks('Are dogs allowed?');

      expect(chunks.length).toBeGreaterThan(0);
      const policyChunk = chunks.find(chunk => chunk.type === 'policies');
      expect(policyChunk).toBeDefined();
      expect(policyChunk?.content).toContain('Dog-friendly patio');
    });

    it('should find amenities chunks', () => {
      const chunks = service.retrieveRelevantChunks('Do you have live music?');

      expect(chunks.length).toBeGreaterThan(0);
      const amenitiesChunk = chunks.find(chunk => chunk.type === 'amenities');
      expect(amenitiesChunk).toBeDefined();
      expect(amenitiesChunk?.content).toContain('Live music schedule');
    });

    it('should handle multiple keyword matches', () => {
      const chunks = service.retrieveRelevantChunks('What are your hours and do you take reservations?');

      expect(chunks.length).toBeGreaterThanOrEqual(2);
      const chunkTypes = chunks.map(chunk => chunk.type);
      expect(chunkTypes).toContain('hours');
      expect(chunkTypes).toContain('policies');
    });

    it('should return empty array for unrelated queries', () => {
      const chunks = service.retrieveRelevantChunks('What is the weather like on Mars?');

      expect(chunks.length).toBe(0);
    });
  });

  describe('formatChunksForPrompt', () => {
    it('should format chunks correctly', () => {
      const mockChunks = [
        {
          type: 'hours',
          content: 'Regular hours: tue: 11:00 AM – 10:00 PM',
          keywords: ['hours']
        },
        {
          type: 'policies',
          content: 'reservations: First-come, first-serve; no reservations',
          keywords: ['reservations']
        }
      ];

      const formatted = service.formatChunksForPrompt(mockChunks);

      expect(formatted).toContain('Business Information:');
      expect(formatted).toContain('HOURS: Regular hours: tue: 11:00 AM – 10:00 PM');
      expect(formatted).toContain('POLICIES: reservations: First-come, first-serve; no reservations');
    });

    it('should return empty string for no chunks', () => {
      const formatted = service.formatChunksForPrompt([]);
      expect(formatted).toBe('');
    });
  });
});
