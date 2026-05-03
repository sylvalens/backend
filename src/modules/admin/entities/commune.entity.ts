import { Column, Entity, PrimaryColumn } from 'typeorm';
import type { Geometry } from 'geojson';

@Entity({ name: 'cad_communes' })
export class Commune {
  @PrimaryColumn({ name: 'id', type: 'varchar' })
  id: string; // e.g. "68001"

  @Column({ name: 'nom', type: 'varchar' })
  name: string;

  @Column({
    name: 'geom',
    type: 'geometry',
    srid: 2154,
    nullable: true,
    select: false,
  })
  geom?: Geometry;
}
