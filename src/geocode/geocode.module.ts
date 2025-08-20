import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { GeocodeService } from './geocode.service';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [ConfigModule, CommonModule],
  providers: [GeocodeService],
  exports: [GeocodeService],
})
export class GeocodeModule {}
