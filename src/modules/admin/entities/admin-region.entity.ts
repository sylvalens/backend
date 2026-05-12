import { Column, Entity, PrimaryColumn, Index } from 'typeorm';
import type { Geometry } from 'geojson';

@Entity({ name: 'admin_regions' })
export class AdminRegion {
  // Use INSEE code as primary key (e.g. "44")
  @PrimaryColumn({ name: 'code_insee', type: 'varchar' })
  codeInsee: string;

  @Column({ name: 'nom_officiel', type: 'varchar' })
  nomOfficiel: string;

  @Index({ spatial: true })
  @Column({
    name: 'geom',
    type: 'geometry',
    srid: 2154,
    nullable: true,
    select: false, // hide geometry by default
  })
  geom?: Geometry;
}
