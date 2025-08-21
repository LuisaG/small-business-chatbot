import { Injectable, Logger } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

interface BusinessInfo {
  business: {
    id: string;
    name: string;
    type: string;
    timezone: string;
    address: string;
    contact: {
      phone: string;
      email: string;
      website: string;
    };
  };
  hours: {
    regular: Record<string, string>;
    service_notes: Record<string, string>;
  };
  policies: Record<string, string>;
  amenities: Record<string, string>;
  meta: {
    last_updated: string;
    sources: string[];
  };
}

interface Chunk {
  type: string;
  content: string;
  keywords: string[];
}

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);
  private businessInfo: BusinessInfo;
  private chunks: Chunk[] = [];

  constructor() {
    this.loadBusinessInfo();
  }

  private loadBusinessInfo() {
    try {
      const yamlPath = path.join(process.cwd(), 'knowledge', 'cellar-sc', 'business-info.yaml');
      this.logger.log(`Attempting to load YAML from: ${yamlPath}`);

      if (!fs.existsSync(yamlPath)) {
        this.logger.error(`YAML file not found at: ${yamlPath}`);
        return;
      }

      const yamlContent = fs.readFileSync(yamlPath, 'utf8');
      this.logger.log(`YAML file loaded, content length: ${yamlContent.length}`);

      this.businessInfo = yaml.load(yamlContent) as BusinessInfo;

      this.createChunks();
      this.logger.log(`Business info loaded successfully. Created ${this.chunks.length} chunks`);
    } catch (error) {
      this.logger.error(`Failed to load business info: ${error.message}`);
      this.businessInfo = null;
    }
  }

  private createChunks() {
    if (!this.businessInfo) return;

    this.logger.debug(`Business info structure: ${JSON.stringify(Object.keys(this.businessInfo))}`);

        const { business } = this.businessInfo;
    if (!business) {
      this.logger.error('No business object found in YAML');
      return;
    }

    this.logger.debug(`Creating chunks for business: ${business.name}`);
    this.logger.debug(`Policies found: ${Object.keys(this.businessInfo.policies || {}).join(', ')}`);

    // Hours chunk
    if (this.businessInfo.hours && this.businessInfo.hours.regular && this.businessInfo.hours.service_notes) {
      const hoursContent = `Regular hours: ${Object.entries(this.businessInfo.hours.regular)
        .map(([day, hours]) => `${day}: ${hours}`)
        .join(', ')}. Service notes: ${Object.entries(this.businessInfo.hours.service_notes)
        .map(([service, note]) => `${service}: ${note}`)
        .join(', ')}`;

      this.chunks.push({
        type: 'hours',
        content: hoursContent,
        keywords: ['hours', 'open', 'close', 'time', 'schedule', 'brunch', 'lunch', 'dinner', 'happy hour']
      });
    }

        // Contact chunk
    if (business.contact) {
      const contactContent = `Address: ${business.address}. Phone: ${business.contact.phone}. Email: ${business.contact.email}. Website: ${business.contact.website}`;

      this.chunks.push({
        type: 'contact',
        content: contactContent,
        keywords: ['address', 'phone', 'email', 'website', 'contact', 'location', 'directions']
      });
    }

    // Policies chunk
    if (this.businessInfo.policies) {
      const policiesContent = Object.entries(this.businessInfo.policies)
        .map(([policy, description]) => `${policy}: ${description}`)
        .join('. ');

      this.chunks.push({
        type: 'policies',
        content: policiesContent,
        keywords: ['policy', 'policies', 'reservation', 'reservations', 'reserve', 'booking', 'book', 'table', 'tables', 'pet', 'pets', 'dog', 'dogs']
      });
    }

    // Amenities chunk
    if (this.businessInfo.amenities) {
      const amenitiesContent = Object.entries(this.businessInfo.amenities)
        .map(([amenity, description]) => `${amenity}: ${description}`)
        .join('. ');

      this.chunks.push({
        type: 'amenities',
        content: amenitiesContent,
        keywords: ['amenity', 'amenities', 'music', 'live', 'patio', 'outdoor', 'seating']
      });
    }

        // Basic info chunk
    if (business.name && business.type && business.address) {
      const basicInfoContent = `${business.name} is a ${business.type} located in ${business.address}`;

      this.chunks.push({
        type: 'basic_info',
        content: basicInfoContent,
        keywords: ['name', 'type', 'business', 'cellar', 'wine', 'bar', 'cafe']
      });
    }
  }

    retrieveRelevantChunks(query: string): Chunk[] {
    if (!this.businessInfo) return [];

    const lowerQuery = query.toLowerCase();
    const relevantChunks: Chunk[] = [];

    this.logger.debug(`Searching for query: "${query}"`);

    for (const chunk of this.chunks) {
      const keywordMatch = chunk.keywords.some(keyword =>
        lowerQuery.includes(keyword.toLowerCase())
      );

      if (keywordMatch) {
        this.logger.debug(`Found matching chunk: ${chunk.type} with content: ${chunk.content.substring(0, 100)}...`);
        relevantChunks.push(chunk);
      }
    }

    this.logger.debug(`Retrieved ${relevantChunks.length} relevant chunks`);
    return relevantChunks;
  }

  formatChunksForPrompt(chunks: Chunk[]): string {
    if (chunks.length === 0) return '';

    const formattedChunks = chunks.map(chunk =>
      `${chunk.type.toUpperCase()}: ${chunk.content}`
    ).join('\n\n');

    return `\n\nBusiness Information:\n${formattedChunks}`;
  }

  getBusinessInfo(): BusinessInfo {
    return this.businessInfo;
  }
}
