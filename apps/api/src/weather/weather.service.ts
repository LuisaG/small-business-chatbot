import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CacheService } from '../common/cache/cache.service';
import { HttpService } from '../common/http/http.service';
import { GeocodeService } from '../geocode/geocode.service';
import { Config } from '../config/configuration';
import { WeatherQueryDto, WeatherResponseDto } from './dto/weather-query.dto';

interface TomorrowResponse {
  data: {
    time: string;
    values: {
      temperature: number;
      weatherCode: number;
    };
  };
}

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);

  constructor(
    private readonly configService: ConfigService<Config>,
    private readonly cacheService: CacheService,
    private readonly httpService: HttpService,
    private readonly geocodeService: GeocodeService,
  ) {}

  async getWeather(query: WeatherQueryDto): Promise<WeatherResponseDto> {
    let lat: number;
    let lon: number;
    let location: string;

    if (query.lat !== undefined && query.lon !== undefined) {
      lat = query.lat;
      lon = query.lon;
      location = `${lat},${lon}`;
    } else if (query.q) {
      const geocodeResult = await this.geocodeService.geocode(query.q);
      lat = geocodeResult.lat;
      lon = geocodeResult.lon;
      location = geocodeResult.location;
    } else {
      throw new Error('Either lat+lon or q must be provided');
    }

    const cacheKey = `weather:${lat}:${lon}`;
    const cached = this.cacheService.get<WeatherResponseDto>(cacheKey);

    if (cached) {
      this.logger.debug(`Cache hit for weather: ${lat},${lon}`);
      return cached;
    }

    this.logger.debug(`Fetching weather for: ${lat},${lon}`);

    const apiKey = this.configService.get('tomorrowApiKey');
    const fields = this.configService.get('tomorrowFields');

    const url = new URL('https://api.tomorrow.io/v4/weather/realtime');
    url.searchParams.set('location', `${lat},${lon}`);
    url.searchParams.set('fields', fields);
    url.searchParams.set('apikey', apiKey);

    const response = await this.httpService.fetch(url.toString());

    if (!response.ok) {
      throw new Error(`Tomorrow.io API error: ${response.status} ${response.statusText}`);
    }

    const data: TomorrowResponse = await response.json();

    const tempC = data.data.values.temperature;
    const tempF = (tempC * 9/5) + 32;

    const result: WeatherResponseDto = {
      location,
      lat,
      lon,
      tempC: Math.round(tempC * 10) / 10,
      tempF: Math.round(tempF * 10) / 10,
      conditionCode: data.data.values.weatherCode.toString(),
      provider: 'tomorrow.io',
    };

    const cacheTtl = this.configService.get('cacheTtlSeconds');
    this.cacheService.set(cacheKey, result, cacheTtl);

    return result;
  }
}
