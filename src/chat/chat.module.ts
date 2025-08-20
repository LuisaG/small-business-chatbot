import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChatController } from './chat.controller';
import { ChatService } from './chat.service';
import { WeatherModule } from '../weather/weather.module';

@Module({
  imports: [ConfigModule, WeatherModule],
  controllers: [ChatController],
  providers: [ChatService],
})
export class ChatModule {}
