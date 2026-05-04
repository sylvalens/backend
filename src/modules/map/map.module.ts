import { Module } from '@nestjs/common';
import { MapService } from './map.service';
import { MapController } from './map.controller';
import { RasterModule } from '../raster/raster.module';

@Module({
  imports: [RasterModule],
  providers: [MapService],
  controllers: [MapController],
})
export class MapModule {}
