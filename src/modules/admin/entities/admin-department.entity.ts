import { Column, Entity, PrimaryColumn } from 'typeorm';
import type { Geometry } from 'geojson';

@Entity({ name: 'admin_departments' })
export class AdminDepartment {
  // Use department INSEE code (e.g. "68") as primary key
  @PrimaryColumn({ name: 'code_insee', type: 'varchar' })
  codeInsee: string;

  @Column({ name: 'code_insee_de_la_region', type: 'varchar' })
  codeInseeRegion: string;

  @Column({ name: 'nom_officiel', type: 'varchar' })
  nomOfficiel: string;

  @Column({
    name: 'geom',
    type: 'geometry',
    srid: 2154,
    nullable: true,
    select: false,
  })
  geom?: Geometry;
}
