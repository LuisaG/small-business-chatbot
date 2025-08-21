import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ChatController } from './chat.controller';
import { ChatSimpleController } from './chat-simple.controller';
import { ChatService } from './chat.service';
import { ChatSimpleService } from './chat-simple.service';
import { WeatherModule } from '../weather/weather.module';
import { RouterModule } from '../router/router.module';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [ConfigModule, WeatherModule, RouterModule, CommonModule],
  controllers: [ChatController, ChatSimpleController],
  providers: [ChatService, ChatSimpleService],
})
export class ChatModule {}
