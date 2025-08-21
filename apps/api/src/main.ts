import { NestFactory } from '@nestjs/core';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './app.module';
import { Config } from './config/configuration';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );

  const configService = app.get(ConfigService<Config>);
  const logger = new Logger('Bootstrap');

  // Register Fastify plugins using the correct syntax
  await app.register(require('@fastify/helmet'));
  await app.register(require('@fastify/cors'), {
    origin: true,
    credentials: true,
  });

  const port = configService.get('port');
  await app.listen(port, '0.0.0.0');

  logger.log(`Application is running on: http://localhost:${port}`);
}

bootstrap();
