import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { RasterController } from './raster.controller';
import { RasterService } from './raster.service';
import { AuthModule } from '../auth/auth.module';

@Module({
  imports: [ConfigModule, AuthModule],
  controllers: [RasterController],
  providers: [RasterService],
  exports: [RasterService],
})
export class RasterModule {}
