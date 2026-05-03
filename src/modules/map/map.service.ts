import { Injectable, BadRequestException } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { RasterService } from '../raster/raster.service';
import type {
  Feature,
  FeatureCollection,
  GeoJsonObject,
  Geometry,
  MultiPolygon,
  Polygon,
} from 'geojson';

export interface PriceMappingItem {
  code_tfv: string;
  bd_foret_label: string;
  tfv_g11_label: string;
  fbf_essence: string;
  price_eur_m3: number;
  note?: string;
}

export interface ForestClass {
  code: string;
  label: string;
}

@Injectable()
export class MapService {
  private priceMapping: PriceMappingItem[] = [];
  private tileCache = new Map<string, Buffer>();
  private forestClassesCache: ForestClass[] | null = null;
  private departmentsCoverageCache: FeatureCollection | null = null;

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly rasterService: RasterService,
  ) {
    this.loadPriceMapping();
  }

  private loadPriceMapping() {
    try {
      const filePath = path.join(__dirname, '..', '..', 'data', 'bd_foret_price_mapping_2024.json');
      if (fs.existsSync(filePath)) {
        this.priceMapping = JSON.parse(fs.readFileSync(filePath, 'utf8'));
      }
    } catch (e) {
      console.error('Failed to load price mapping:', e);
    }
  }

  async getCommuneCenter(communeId: string) {
    const sql = `
      SELECT
        ST_X(ST_Transform(ST_Centroid(geom), 4326)) AS lon,
        ST_Y(ST_Transform(ST_Centroid(geom), 4326)) AS lat
      FROM cad_communes
      WHERE id = $1
      LIMIT 1;
    `;

    const rows = await this.dataSource.query(sql, [communeId]);

    if (!rows.length) {
      throw new Error(`Commune ${communeId} not found`);
    }

    const row = rows[0] as { lon: number; lat: number };

    return {
      lon: Number(row.lon),
      lat: Number(row.lat),
    };
  }
  async getLieuDitGeometry(lieuDitId: number) {
    const sql = `
      SELECT
        ogc_fid,
        nom,
        commune,
        ST_AsGeoJSON(ST_Transform(geom, 4326)) AS geom
      FROM cad_lieux_dits
      WHERE ogc_fid = $1
      LIMIT 1;
    `;

    const rows = await this.dataSource.query(sql, [lieuDitId]);

    if (!rows.length) {
      throw new Error(`Lieu-dit ${lieuDitId} not found`);
    }

    const row = rows[0] as {
      ogc_fid: number;
      nom: string;
      commune: string;
      geom: string;
    };

    return {
      type: 'FeatureCollection',
      features: [
        {
          type: 'Feature',
          geometry: JSON.parse(row.geom),
          properties: {
            id: row.ogc_fid,
            name: row.nom,
            communeId: row.commune,
          },
        },
      ],
    };
  }

  async getMvtTile(layer: string, z: number, x: number, y: number): Promise<Buffer | null> {
    const cacheKey = `${layer}:${z}:${x}:${y}`;
    if (this.tileCache.has(cacheKey)) {
      return this.tileCache.get(cacheKey)!;
    }

    const layerMap: Record<string, { table: string, properties: Record<string, string> }> = {
      'regions': { table: 'admin_regions', properties: { codeInsee: 'code_insee', nomOfficiel: 'nom_officiel' } },
      'departments': { table: 'admin_departments', properties: { codeInsee: 'code_insee', nomOfficiel: 'nom_officiel', parentId: 'code_insee_de_la_region' } },
      'communes': { table: 'cad_communes', properties: { codeInsee: 'id', nomOfficiel: 'nom' } },
      'forests': { table: 'forest_formation', properties: { id: 'id', tfvG11: 'tfv_g11' } },
      'parcels': { table: 'cad_parcelles', properties: { id: 'ogc_fid', commune: 'commune' } },
    };

    const l = layerMap[layer];
    if (!l) throw new BadRequestException(`Layer ${layer} not found`);

    const propsSelect = Object.entries(l.properties)
      .map(([alias, col]) => `t.${col} AS "${alias}"`)
      .join(', ');

    const sql = `
      WITH bounds AS (
        SELECT ST_TileEnvelope($1, $2, $3) AS geom
      ),
      bounds_native AS (
        SELECT ST_Transform(geom, 2154) AS geom FROM bounds
      ),
      mvtgeom AS (
        SELECT 
          ST_AsMVTGeom(ST_Transform(t.geom, 3857), bounds.geom) AS geom,
          ${propsSelect}
        FROM ${l.table} t, bounds, bounds_native
        WHERE ST_Intersects(t.geom, bounds_native.geom)
      )
      SELECT ST_AsMVT(mvtgeom, $4) AS tile FROM mvtgeom;
    `;

    const rows = await this.dataSource.query(sql, [z, x, y, layer]);
    let tile = null;
    if (rows && rows[0] && rows[0].tile) {
      tile = rows[0].tile;
      
      // Simple LRU: remove oldest if over limit
      if (this.tileCache.size > 5000) {
        const firstKey = this.tileCache.keys().next().value;
        if (firstKey) this.tileCache.delete(firstKey);
      }
      this.tileCache.set(cacheKey, tile);
    }
    
    return tile;
  }

  async getAdminBbox(level: string, id: string) {
    let tableName = '';
    let idColumn = '';
    if (level === 'region') {
      tableName = 'admin_regions'; idColumn = 'code_insee';
    } else if (level === 'department') {
      tableName = 'admin_departments'; idColumn = 'code_insee';
    } else if (level === 'commune') {
      tableName = 'cad_communes'; idColumn = 'id';
    } else {
      throw new BadRequestException('Invalid level');
    }

    const sql = `
      SELECT ST_AsGeoJSON(ST_Extent(ST_Transform(geom, 4326))) AS bbox 
      FROM ${tableName} 
      WHERE ${idColumn} = $1;
    `;
    const rows = await this.dataSource.query(sql, [id]);
    if (!rows || !rows[0] || !rows[0].bbox) return null;
    
    const geom = JSON.parse(rows[0].bbox);
    const coords = geom.coordinates[0];
    const minX = coords[0][0];
    const minY = coords[0][1];
    const maxX = coords[2][0];
    const maxY = coords[2][1];
    return [minX, minY, maxX, maxY];
  }

  async getLieuxDitsLayer(communeId: string) {
    const sql = `
      SELECT
        ogc_fid,
        nom,
        commune,
        ST_AsGeoJSON(ST_Transform(geom, 4326)) AS geom
      FROM cad_lieux_dits
      WHERE commune = $1;
    `;

    const rows = await this.dataSource.query(sql, [communeId]);

    return {
      type: 'FeatureCollection',
      features: rows.map((row: Record<string, any>) => ({
        type: 'Feature',
        geometry: JSON.parse(row.geom),
        properties: {
          id: row.ogc_fid,
          name: row.nom,
          communeId: row.commune,
        },
      })),
    };
  }
  async getParcelsByBbox(bbox: string, limit = 2000) {
    const parts = bbox.split(',').map((v) => Number(v.trim()));
    if (parts.length !== 4 || parts.some((n) => Number.isNaN(n))) {
      throw new BadRequestException(
        'bbox must be "minLon,minLat,maxLon,maxLat" (numbers)',
      );
    }

    const [minLon, minLat, maxLon, maxLat] = parts;
    const lim = Math.min(Math.max(limit, 1), 10000);

    const sql = `
      SELECT
        ogc_fid,
        commune,
        ST_AsGeoJSON(ST_Transform(geom, 4326)) AS geom
      FROM cad_parcelles
      WHERE ST_Intersects(
        geom,
        ST_Transform(
          ST_MakeEnvelope($1, $2, $3, $4, 4326),
          2154
        )
      )
      LIMIT $5;
    `;

    const rows = await this.dataSource.query(sql, [
      minLon,
      minLat,
      maxLon,
      maxLat,
      lim,
    ]);

    return {
      type: 'FeatureCollection',
      features: rows.map((row: Record<string, any>) => ({
        type: 'Feature',
        geometry: JSON.parse(row.geom),
        properties: {
          id: row.ogc_fid,
          communeId: row.commune,
        },
      })),
    };
  }
  
  async getDepartmentsCoverage() {
    if (this.departmentsCoverageCache) return this.departmentsCoverageCache;

    const sql = `
      SELECT
        code_insee,
        nom_officiel,
        forest_area_ha,
        forest_pct,
        geom
      FROM dept_forest_coverage
      ORDER BY code_insee;
    `;
    const rows = await this.dataSource.query(sql);
    
    this.departmentsCoverageCache = {
      type: 'FeatureCollection',
      features: rows.map((row: Record<string, any>) => ({
        type: 'Feature',
        geometry: JSON.parse(row.geom),
        properties: {
          codeInsee: row.code_insee,
          nomOfficiel: row.nom_officiel,
          forestAreaHa: Number(row.forest_area_ha),
          forestPct: Number(row.forest_pct),
        },
      })),
    };
    return this.departmentsCoverageCache;
  }

  async getForestClasses() {
    if (this.forestClassesCache) return this.forestClassesCache;

    const sql = `
        SELECT
        tfv_g11,
        MIN(tfv) AS tfv_label
        FROM forest_formation
        WHERE tfv_g11 IS NOT NULL
        GROUP BY tfv_g11
        ORDER BY tfv_g11;
    `;

    const rows = await this.dataSource.query(sql);

    this.forestClassesCache = rows.map((row: Record<string, any>) => ({
        code: String(row.tfv_g11),
        label: row.tfv_label || `Group ${row.tfv_g11}`,
    }));
    return this.forestClassesCache;
  }

  async getAdminStats(level: string, id: string) {
    let tableName = '';
    let idColumn = '';

    switch (level) {
      case 'region':
        tableName = 'admin_regions';
        idColumn = 'code_insee';
        break;
      case 'department':
        tableName = 'admin_departments';
        idColumn = 'code_insee';
        break;
      case 'commune':
        tableName = 'cad_communes';
        idColumn = 'id';
        break;
      case 'lieu-dit':
        tableName = 'cad_lieux_dits';
        idColumn = 'ogc_fid';
        break;
      default:
        throw new BadRequestException('Invalid level');
    }

    const sql = `
      SELECT ST_AsGeoJSON(ST_Transform(geom, 4326)) AS geom
      FROM ${tableName}
      WHERE ${idColumn} = $1
    `;

    // Try treating ID as string, but if level is lieu-dit and ID is a number, we might need to parse it. 
    // TypeORM parameterization handles string/number conversion nicely if the driver knows. 
    // In postgres it will cast implicitly if possible. If not, we can safely just pass string.
    const rows = await this.dataSource.query(sql, [id]);
    if (!rows.length) {
      throw new BadRequestException('Area not found');
    }

    const geometry = JSON.parse(rows[0].geom);
    const stats = await this.getPolygonStats(geometry);
    return { ...stats, geometry };
  }

  async getPolygonStats(geometry: GeoJsonObject) {
    const polygonGeometry = this.extractPolygonGeometry(geometry);
    if (!polygonGeometry) {
      throw new BadRequestException(
        'geometry must be a Feature/Geometry of type Polygon or MultiPolygon',
      );
    }

    const geomString = JSON.stringify(polygonGeometry);
    const polygonCte = `
      SELECT ST_Transform(
        ST_SetSRID(ST_GeomFromGeoJSON($1), 4326),
        2154
      ) AS geom
    `;

    const areaSql = `
      WITH poly AS (${polygonCte})
      SELECT COALESCE(ST_Area(geom) / 10000, 0) AS hectares
      FROM poly;
    `;

    const parcelsSql = `
      WITH poly AS (${polygonCte})
      SELECT DISTINCT ogc_fid::text AS parcel_id
      FROM cad_parcelles cp, poly
      WHERE ST_Intersects(cp.geom, poly.geom)
      ORDER BY parcel_id
      LIMIT 200;
    `;

    const speciesSql = `
      WITH poly AS (${polygonCte})
      SELECT
        COALESCE(f.essence, 'Unknown') AS species,
        f.code_tfv,
        SUM(ST_Area(ST_Intersection(f.geom, poly.geom)) / 10000) AS hectares
      FROM forest_formation f, poly
      WHERE ST_Intersects(f.geom, poly.geom)
      GROUP BY species, f.code_tfv
      HAVING SUM(ST_Area(ST_Intersection(f.geom, poly.geom))) > 0
      ORDER BY hectares DESC;
    `;

    const [areaRows, parcelRows, speciesRows] = await Promise.all([
      this.dataSource.query(areaSql, [geomString]),
      this.dataSource.query(parcelsSql, [geomString]),
      this.dataSource.query(speciesSql, [geomString]),
    ]);

    const areaHa =
      areaRows.length && areaRows[0]?.hectares != null
        ? Number(areaRows[0].hectares)
        : 0;

    const parcelIds = parcelRows.map((row: Record<string, any>) => row.parcel_id);
    
    // Total forest area within the polygon (may be less than areaHa if polygon includes non-forest)
    let totalForestAreaHa = 0;
    const treeSpecies: Array<{
      species: string;
      codeTfv: string | null;
      areaHa: number;
      priceEurM3: number | null;
    }> = speciesRows.map((row: { species: string | null; code_tfv: string | null; hectares: number | string }) => {
      const area = row.hectares != null ? Number(row.hectares) : 0;
      totalForestAreaHa += area;
      
      // Lookup price with improved fallback logic
      let priceMap = this.priceMapping.find(m => m.code_tfv === row.code_tfv);
      
      if (!priceMap && row.code_tfv) {
        // Try prefixes (e.g., FF1-00-00 -> FF1-00 -> FF1)
        const parts = row.code_tfv.split('-');
        if (parts.length > 1) {
          const prefix = parts[0] + '-'; // e.g., FF1-
          priceMap = this.priceMapping.find(m => m.code_tfv === prefix);
        }
        
        // Broad fallbacks if still not found
        if (!priceMap) {
          if (row.code_tfv.startsWith('FF1')) {
            priceMap = this.priceMapping.find(m => m.code_tfv === 'FF1G-') || { price_eur_m3: 125 } as PriceMappingItem;
          } else if (row.code_tfv.startsWith('FF2')) {
            priceMap = this.priceMapping.find(m => m.code_tfv === 'FF2G-') || { price_eur_m3: 60 } as PriceMappingItem;
          } else if (row.code_tfv.startsWith('FF')) {
            priceMap = this.priceMapping.find(m => m.code_tfv === 'FM-') || { price_eur_m3: 90 } as PriceMappingItem;
          }
        }
      }
      
      return {
        species: row.species ?? 'Unknown',
        codeTfv: row.code_tfv,
        areaHa: area,
        priceEurM3: priceMap ? priceMap.price_eur_m3 : null
      };
    });

    // 2. Parallel Raster Analysis
    let rasterStats: Record<string, any> | null = null;
    let forestChange: Record<string, any> | null = null;
    let lidar: Record<string, any> | null = null;

    const [rStats, fChange, lStats] = await Promise.all([
      this.rasterService.getFormsStats(polygonGeometry),
      this.rasterService.getForestChange(polygonGeometry),
      this.rasterService.getLidarStats(polygonGeometry)
    ]);
    rasterStats = rStats;
    forestChange = fChange;
    lidar = lStats;

    // 3. Derived Calculations
    let standingVolumeM3 = 0;
    let estimatedValueEur = 0;
    let carbonStockTCO2e = 0;

    if (rasterStats && rasterStats.wvd) {
      // WVD is in m3/ha. We use total forest area for volume.
      standingVolumeM3 = rasterStats.wvd.mean * totalForestAreaHa;
      
      // Value calculation: sum(species_area * WVD_mean * species_price)
      treeSpecies.forEach((s) => {
        if (s.priceEurM3) {
          estimatedValueEur += s.areaHa * rasterStats!.wvd!.mean * s.priceEurM3;
        }
      });
    }

    if (rasterStats && rasterStats.agbd) {
      // Carbon stock (tCO2e) = AGBD * area * BEF * (1+root) * fraction * (44/12)
      // We'll use a simplified weighted BEF based on broadleaf vs conifer
      // FF1 = Broadleaf, FF2 = Conifer
      let totalWeightedBef = 0;
      treeSpecies.forEach((s) => {
        const bef = (s.codeTfv?.startsWith('FF2') || s.codeTfv?.startsWith('FF5')) ? 1.2 : 1.3;
        totalWeightedBef += (s.areaHa / (totalForestAreaHa || 1)) * bef;
      });
      if (totalWeightedBef === 0) totalWeightedBef = 1.25;

      const agbdMg = rasterStats.agbd.mean * totalForestAreaHa;
      const rootRatio = 0.24;
      const carbonFraction = 0.47;
      const co2Factor = 44/12;
      
      carbonStockTCO2e = agbdMg * totalWeightedBef * (1 + rootRatio) * carbonFraction * co2Factor;
    }

    return {
      areaHa,
      totalForestAreaHa,
      parcelIds,
      treeSpecies,
      rasterStats,
      forestChange,
      lidar,
      standingVolumeM3,
      estimatedValueEur,
      carbonStockTCO2e
    };
  }

  private extractPolygonGeometry(
    geometry: GeoJsonObject,
  ): Polygon | MultiPolygon | null {
    if (!geometry) {
      return null;
    }

    if ((geometry as FeatureCollection).type === 'FeatureCollection') {
      const fc = geometry as FeatureCollection;
      const firstFeature = fc.features?.[0];
      if (!firstFeature) return null;
      return this.extractPolygonGeometry(firstFeature);
    }

    if ((geometry as Feature).type === 'Feature') {
      const feature = geometry as Feature;
      if (!feature.geometry) return null;
      return this.extractPolygonGeometry(feature.geometry);
    }

    const geom = geometry as Geometry;
    if (!geom?.type) return null;
    if (geom.type === 'Polygon' || geom.type === 'MultiPolygon') {
      return geom as Polygon | MultiPolygon;
    }

    return null;
  }
}
