import { Column, Entity, PrimaryColumn, Index } from 'typeorm';
import type { Geometry } from 'geojson';

@Entity({ name: 'cad_lieux_dits' })
export class LieuDit {
  // Use ogc_fid as identifier for this table
  @PrimaryColumn({ name: 'ogc_fid', type: 'integer' })
  id: number;

  @Column({ name: 'nom', type: 'varchar' })
  name: string;

  // Commune ID like "68001"
  @Index()
  @Column({ name: 'commune', type: 'varchar' })
  communeId: string;

  @Index({ spatial: true })
  @Column({
    name: 'geom',
    type: 'geometry',
    srid: 2154,
    nullable: true,
    select: false,
  })
  geom?: Geometry;
}
