import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { LoggerModule } from 'nestjs-pino';
import { HealthModule } from './health/health.module';
import { WeatherModule } from './weather/weather.module';
import { ChatModule } from './chat/chat.module';
import { RouterModule } from './router/router.module';
import { CommonModule } from './common/common.module';
import { configuration } from './config/configuration';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '../../.env',
      load: [configuration],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    LoggerModule.forRoot({
      pinoHttp: {
        transport: {
          target: 'pino-pretty',
          options: {
            singleLine: true,
          },
        },
        customProps: (req, res) => ({
          context: 'HTTP',
        }),
        customLogLevel: (req, res, err) => {
          if (res.statusCode >= 400 && res.statusCode < 500) {
            return 'warn';
          }
          if (res.statusCode >= 500 || err) {
            return 'error';
          }
          return 'info';
        },
        customSuccessMessage: (req) => {
          return `${req.method} ${req.url}`;
        },
        customErrorMessage: (req, res) => {
          return `${req.method} ${req.url} - ${res.statusCode}`;
        },
      },
    }),
    HealthModule,
    WeatherModule,
    ChatModule,
    RouterModule,
    CommonModule,
  ],
})
export class AppModule {}
