import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../common/cache/cache.service';
import { HttpService } from '../common/http/http.service';
import { Config } from '../config/configuration';

interface NominatimResponse {
  display_name: string;
  lat: string;
  lon: string;
}

@Injectable()
export class GeocodeService {
  private readonly logger = new Logger(GeocodeService.name);

  constructor(
    private readonly configService: ConfigService<Config>,
    private readonly cacheService: CacheService,
    private readonly httpService: HttpService,
  ) {}

  async geocode(query: string): Promise<{ location: string; lat: number; lon: number }> {
    const cacheKey = `geocode:${query}`;
    const cached = this.cacheService.get<{ location: string; lat: number; lon: number }>(cacheKey);

    if (cached) {
      this.logger.debug(`Cache hit for geocode query: ${query}`);
      return cached;
    }

    this.logger.debug(`Geocoding query: ${query}`);

    const userAgent = this.configService.get('nominatimUserAgent');
    const url = new URL('https://nominatim.openstreetmap.org/search');
    url.searchParams.set('q', query);
    url.searchParams.set('format', 'json');
    url.searchParams.set('limit', '1');

    const response = await this.httpService.fetch(url.toString(), {
      headers: {
        'User-Agent': userAgent,
      },
    });

    if (!response.ok) {
      throw new Error(`Nominatim API error: ${response.status} ${response.statusText}`);
    }

    const data: NominatimResponse[] = await response.json();

    if (!data || data.length === 0) {
      throw new Error(`No results found for query: ${query}`);
    }

    const result = {
      location: data[0].display_name,
      lat: parseFloat(data[0].lat),
      lon: parseFloat(data[0].lon),
    };

    const cacheTtl = this.configService.get('cacheTtlSeconds');
    this.cacheService.set(cacheKey, result, cacheTtl);

    return result;
  }
}
