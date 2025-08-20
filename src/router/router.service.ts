import { Injectable, Logger } from '@nestjs/common';
import { RouterInputDto, RouterOutputDto } from './dto/router.dto';

@Injectable()
export class RouterService {
  private readonly logger = new Logger(RouterService.name);

  private readonly weatherKeywords = [
    'weather', 'forecast', 'rain', 'temp', 'temperature', 'wind', 'humidity', 'uv',
    'sunny', 'cloudy', 'aqi', 'hot', 'cold', 'warm', 'cool', 'storm', 'snow',
    'fog', 'mist', 'drizzle', 'shower', 'thunder', 'lightning', 'breeze', 'gust'
  ];

  private readonly businessKeywords = [
    'hours', 'open', 'close', 'closed', 'menu', 'price', 'cost', 'wifi', 'internet',
    'seating', 'table', 'patio', 'outdoor', 'dog', 'pet', 'policy', 'policies',
    'refund', 'return', 'reservation', 'book', 'booking', 'phone', 'call',
    'email', 'address', 'location', 'directions', 'parking', 'delivery',
    'takeout', 'take-out', 'dine-in', 'dinein', 'curbside', 'pickup',
    'pastries', 'food', 'cater', 'catering', 'wedding', 'weddings', 'event', 'events'
  ];

  async routeMessage(input: RouterInputDto): Promise<RouterOutputDto> {
    const { message, businessId = 'cellar-sc' } = input;
    const lowerMessage = message.toLowerCase();

    // Check for weather keywords
    const hasWeather = this.weatherKeywords.some(keyword =>
      lowerMessage.includes(keyword)
    );

    // Check for business keywords
    const hasBusiness = this.businessKeywords.some(keyword =>
      lowerMessage.includes(keyword)
    );

    // Determine route
    let route: 'weather' | 'business' | 'both' | 'fallback';
    if (hasWeather && hasBusiness) {
      route = 'both';
    } else if (hasWeather) {
      route = 'weather';
    } else if (hasBusiness) {
      route = 'business';
    } else {
      route = 'fallback';
    }

    // Extract timeframe
    const timeframe = this.extractTimeframe(lowerMessage);

    // Extract business facets
    const businessFacets = this.extractBusinessFacets(lowerMessage);

    this.logger.debug(`Routed message to: ${route} with facets: ${businessFacets.join(', ')}`);

    return {
      route,
      location: {
        type: 'business_id',
        value: businessId,
      },
      timeframe,
      business_facets: businessFacets,
    };
  }

  private extractTimeframe(message: string): string {
    // Check for explicit time references
    if (message.includes('now') || message.includes('current') || message.includes('today')) {
      return 'now';
    }

    // Check for relative time references
    const relativePatterns = [
      { pattern: /tomorrow/i, value: 'relative:tomorrow' },
      { pattern: /yesterday/i, value: 'relative:yesterday' },
      { pattern: /next week/i, value: 'relative:next week' },
      { pattern: /this weekend/i, value: 'relative:this weekend' },
      { pattern: /tonight/i, value: 'relative:tonight' },
      { pattern: /this evening/i, value: 'relative:this evening' },
      { pattern: /this afternoon/i, value: 'relative:this afternoon' },
      { pattern: /this morning/i, value: 'relative:this morning' },
    ];

    for (const { pattern, value } of relativePatterns) {
      if (pattern.test(message)) {
        return value;
      }
    }

    // Check for explicit ISO-like patterns (simplified)
    const isoPattern = /(\d{4}-\d{2}-\d{2})/;
    const isoMatch = message.match(isoPattern);
    if (isoMatch) {
      return `explicit:${isoMatch[1]}`;
    }

    return 'now';
  }

  private extractBusinessFacets(message: string): string[] {
    const facets: string[] = [];

    // Map keywords to facets
    const facetMappings = {
      hours: ['hours', 'open', 'close', 'closed', 'schedule'],
      menu: ['menu', 'food', 'drink', 'dish', 'meal', 'cuisine', 'pastries'],
      wifi: ['wifi', 'internet', 'wireless'],
      seating: ['seating', 'table', 'chair', 'capacity'],
      patio: ['patio', 'outdoor', 'terrace', 'garden'],
      dog: ['dog', 'pet', 'animal'],
      policy: ['policy', 'policies', 'rule', 'guideline', 'cater', 'catering', 'wedding', 'weddings', 'event', 'events'],
      refund: ['refund', 'return', 'exchange'],
      reservation: ['reservation', 'book', 'booking', 'reserve'],
      contact: ['phone', 'call', 'email', 'contact'],
      address: ['address', 'location', 'directions', 'where'],
      parking: ['parking', 'park'],
      delivery: ['delivery', 'deliver', 'takeout', 'take-out', 'curbside', 'pickup'],
    };

    for (const [facet, keywords] of Object.entries(facetMappings)) {
      if (keywords.some(keyword => message.includes(keyword))) {
        facets.push(facet);
      }
    }

    return facets;
  }
}
