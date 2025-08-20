import { Controller, Get, Query, UsePipes } from '@nestjs/common';
import { WeatherService } from './weather.service';
import { WeatherQueryDto, WeatherQuerySchema } from './dto/weather-query.dto';
import { ZodValidationPipe } from '../common/pipes/zod-validation.pipe';

@Controller('weather')
export class WeatherController {
  constructor(private readonly weatherService: WeatherService) {}

  @Get()
  @UsePipes(new ZodValidationPipe(WeatherQuerySchema))
  async getWeather(@Query() query: WeatherQueryDto) {
    return this.weatherService.getWeather(query);
  }
}
