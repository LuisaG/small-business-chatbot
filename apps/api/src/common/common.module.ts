import { Module } from '@nestjs/common';
import { CacheService } from './cache/cache.service';
import { HttpService } from './http/http.service';
import { RagService } from './rag/rag.service';

@Module({
  providers: [CacheService, HttpService, RagService],
  exports: [CacheService, HttpService, RagService],
})
export class CommonModule {}
