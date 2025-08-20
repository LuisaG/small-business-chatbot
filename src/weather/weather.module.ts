import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WeatherController } from './weather.controller';
import { WeatherService } from './weather.service';
import { CommonModule } from '../common/common.module';
import { GeocodeModule } from '../geocode/geocode.module';

@Module({
  imports: [ConfigModule, CommonModule, GeocodeModule],
  controllers: [WeatherController],
  providers: [WeatherService],
  exports: [WeatherService],
})
export class WeatherModule {}
