import { IsNotEmptyObject } from 'class-validator';
import type { GeoJsonObject } from 'geojson';

export class PolygonStatsDto {
  @IsNotEmptyObject()
  geometry: GeoJsonObject;
}
