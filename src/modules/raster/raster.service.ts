import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GeoJsonObject } from 'geojson';

@Injectable()
export class RasterService {
  private readonly rasterServiceUrl: string;
  private readonly defaultTimeoutMs: number;
  private readonly lidarTimeoutMs: number;

  constructor(private configService: ConfigService) {
    this.rasterServiceUrl = this.configService.get<string>('RASTER_SERVICE_URL') || 'http://localhost:8000';
    this.defaultTimeoutMs = this.getTimeoutMs('RASTER_TIMEOUT_MS', 15000);
    this.lidarTimeoutMs = this.getTimeoutMs('RASTER_LIDAR_TIMEOUT_MS', 90000);
  }

  async getFormsStats(geometry: GeoJsonObject, year: number = 2024) {
    return this.proxyPost('/raster/forms-stats', { geometry }, { year: year.toString() });
  }

  async getFormsHeightGrid(
    geometry: GeoJsonObject,
    options?: { year?: number; cellSizeM?: number; maxCells?: number },
  ) {
    const year = options?.year ?? 2024;
    const cellSizeM = options?.cellSizeM ?? 40;
    const maxCells = options?.maxCells ?? 2500;

    return this.proxyPost(
      '/raster/forms-height-grid',
      { geometry },
      {
        year: year.toString(),
        cellSizeM: cellSizeM.toString(),
        maxCells: maxCells.toString(),
      },
      this.lidarTimeoutMs,
    );
  }

  async getForestChange(geometry: GeoJsonObject) {
    return this.proxyPost('/raster/forest-change', { geometry });
  }

  async getForestLossPixels(geometry: GeoJsonObject, year?: number) {
    const url = year ? `/raster/forest-loss-pixels?year=${year}` : '/raster/forest-loss-pixels';
    return this.proxyPost(url, { geometry });
  }

  async getLidarStats(geometry: GeoJsonObject) {
    return this.proxyPost('/raster/lidar-stats', { geometry }, {}, this.lidarTimeoutMs);
  }

  async getLidarCoverage() {
    return this.proxyGet('/raster/lidar-coverage');
  }

  private async proxyGet(
    path: string,
    queryParams: Record<string, string> = {},
    timeoutMs: number = this.defaultTimeoutMs,
  ) {
    const url = new URL(`${this.rasterServiceUrl}${path}`);
    Object.entries(queryParams).forEach(([key, val]) => url.searchParams.append(key, val));

    try {
      const response = await fetch(url.toString(), {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new HttpException(
          `Raster service error: ${response.status} - ${errorText}`,
          response.status,
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Failed to connect to raster service: ${(error as Error).message}`,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  private async proxyPost(
    path: string,
    body: unknown,
    queryParams: Record<string, string> = {},
    timeoutMs: number = this.defaultTimeoutMs,
  ) {
    const url = new URL(`${this.rasterServiceUrl}${path}`);
    Object.entries(queryParams).forEach(([key, val]) => url.searchParams.append(key, val));

    try {
      const response = await fetch(url.toString(), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeoutMs),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new HttpException(
          `Raster service error: ${response.status} - ${errorText}`,
          response.status,
        );
      }

      return await response.json();
    } catch (error) {
      if (error instanceof HttpException) throw error;
      throw new HttpException(
        `Failed to connect to raster service: ${(error as Error).message}`,
        HttpStatus.SERVICE_UNAVAILABLE,
      );
    }
  }

  private getTimeoutMs(envKey: string, fallbackMs: number): number {
    const rawValue = this.configService.get<string>(envKey);
    const parsed = Number(rawValue);
    if (!rawValue || Number.isNaN(parsed) || parsed <= 0) {
      return fallbackMs;
    }
    return parsed;
  }
}
