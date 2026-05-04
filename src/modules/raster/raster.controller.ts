import {
  Controller,
  Post,
  Body,
  Query,
  Get,
  BadRequestException,
} from '@nestjs/common';
import { RasterService } from './raster.service';
import { GeoJsonObject } from 'geojson';

@Controller('map/raster')
export class RasterController {
  constructor(private readonly rasterService: RasterService) {}

  @Get('lidar-coverage')
  async getLidarCoverage() {
    return this.rasterService.getLidarCoverage();
  }

  @Post('forms-stats')
  async getFormsStats(
    @Body() body: { geometry: GeoJsonObject },
    @Query('year') year?: number,
  ) {
    return this.rasterService.getFormsStats(body.geometry, year);
  }

  @Post('forms-height-grid')
  async getFormsHeightGrid(
    @Body() body: { geometry: GeoJsonObject },
    @Query('year') year?: string,
    @Query('cellSizeM') cellSizeM?: string,
    @Query('maxCells') maxCells?: string,
  ) {
    return this.rasterService.getFormsHeightGrid(body.geometry, {
      year: year ? Number(year) : undefined,
      cellSizeM: cellSizeM ? Number(cellSizeM) : undefined,
      maxCells: maxCells ? Number(maxCells) : undefined,
    });
  }

  @Post('forest-change')
  async getForestChange(@Body() body: { geometry: GeoJsonObject }) {
    return this.rasterService.getForestChange(body.geometry);
  }

  @Post('forest-loss-pixels')
  async getForestLossPixels(
    @Body() body: { geometry: GeoJsonObject },
    @Query('year') year?: string,
  ) {
    if (year !== undefined) {
      const parsedYear = Number(year);
      if (isNaN(parsedYear) || parsedYear < 2000 || parsedYear > 2050) {
        throw new BadRequestException(
          'year must be a valid number between 2000 and 2050',
        );
      }
      return this.rasterService.getForestLossPixels(body.geometry, parsedYear);
    }
    return this.rasterService.getForestLossPixels(body.geometry);
  }

  @Post('lidar-stats')
  async getLidarStats(@Body() body: { geometry: GeoJsonObject }) {
    return this.rasterService.getLidarStats(body.geometry);
  }
}
