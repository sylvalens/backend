import {
  Body,
  Controller,
  Get,
  Header,
  Param,
  Post,
  Query,
  Res,
  BadRequestException,
} from '@nestjs/common';
import type { Response as ExpressResponse } from 'express';
import { MapService } from './map.service';
import { PolygonStatsDto } from './dto/polygon-stats.dto';

@Controller('map')
export class MapController {
  constructor(private readonly mapService: MapService) {}

  @Get('commune-center')
  async getCommuneCenter(@Query('id') id?: string) {
    if (!id) {
      throw new BadRequestException('id query parameter is required');
    }
    return this.mapService.getCommuneCenter(id);
  }

  @Get('lieu-dit')
  async getLieuDit(@Query('id') id?: string) {
    if (!id) {
      throw new BadRequestException('id query parameter is required');
    }
    const num = Number(id);
    if (Number.isNaN(num)) {
      throw new BadRequestException('id must be a number');
    }
    return this.mapService.getLieuDitGeometry(num);
  }

  @Get('tiles/:layer/:z/:x/:y')
  async getMvtTile(
    @Param('layer') layer: string,
    @Param('z') z: string,
    @Param('x') x: string,
    @Param('y') y: string,
    @Res() res: ExpressResponse,
  ) {
    const tile = await this.mapService.getMvtTile(
      layer,
      parseInt(z, 10),
      parseInt(x, 10),
      parseInt(y, 10),
    );

    if (!tile) {
      res.status(204).send(); // No content
      return;
    }

    res.setHeader('Content-Type', 'application/vnd.mapbox-vector-tile');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Cache-Control', 'public, max-age=86400'); // 24h for static geo data
    res.setHeader('ETag', `"${layer}-${z}-${x}-${y}"`);
    res.send(tile);
  }

  @Get('admin-bbox')
  async getAdminBbox(@Query('level') level?: string, @Query('id') id?: string) {
    if (!level || !id) {
      throw new BadRequestException(
        'level and id query parameters are required',
      );
    }
    return this.mapService.getAdminBbox(level, id);
  }

  @Get('lieux-dits-layer')
  async getLieuxDitsLayer(@Query('communeId') communeId?: string) {
    if (!communeId) {
      throw new BadRequestException('communeId query parameter is required');
    }
    return this.mapService.getLieuxDitsLayer(communeId);
  }

  @Get('parcels')
  async getParcels(
    @Query('bbox') bbox?: string,
    @Query('limit') limit?: string,
  ) {
    if (!bbox) {
      throw new BadRequestException('bbox query parameter is required');
    }
    const lim = limit ? Number(limit) : 2000;
    return this.mapService.getParcelsByBbox(bbox, lim);
  }

  @Get('departments-coverage')
  @Header('Cache-Control', 'public, max-age=300, stale-while-revalidate=86400')
  async getDepartmentsCoverage() {
    return this.mapService.getDepartmentsCoverage();
  }

  @Get('forest-classes')
  async getForestClasses() {
    return this.mapService.getForestClasses();
  }

  @Get('admin-stats')
  async getAdminStats(@Query('level') level: string, @Query('id') id: string) {
    if (!level || !id) {
      throw new BadRequestException(
        'level and id query parameters are required',
      );
    }
    return this.mapService.getAdminStats(level, id);
  }

  @Post('polygon-stats')
  async getPolygonStats(@Body() body: PolygonStatsDto) {
    return this.mapService.getPolygonStats(body.geometry);
  }
}
