import { Module } from '@nestjs/common';
import { CacheService } from './cache/cache.service';
import { HttpService } from './http/http.service';

@Module({
  providers: [CacheService, HttpService],
  exports: [CacheService, HttpService],
})
export class CommonModule {}
