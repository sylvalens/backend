import { MigrationInterface, QueryRunner } from 'typeorm';

export class Migration1778548657226 implements MigrationInterface {
  name = 'Migration1778548657226';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."cad_lieux_dits_geom_geom_idx"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."cad_lieux_dits_geom_idx"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."cad_lieux_dits_commune_idx"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."admin_regions_geom_geom_idx"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."admin_regions_geom_idx"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."admin_regions_code_insee_idx"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."admin_departments_geom_geom_idx"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."admin_departments_geom_idx"`);
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."admin_departments_code_insee_idx"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."admin_departments_code_insee_de_la_region_idx"`,
    );
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."cad_communes_geom_geom_idx"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."cad_communes_geom_idx"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "public"."cad_communes_id_idx"`);
    await queryRunner.query(
      `CREATE TABLE IF NOT EXISTS "users" ("id" uuid NOT NULL, "email" character varying(255) NOT NULL, "password_hash" character varying(255) NOT NULL, "display_name" character varying(255), "lastMapState" jsonb, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"), CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id"))`,
    );
    await queryRunner.query(
      `ALTER TABLE "cad_lieux_dits" DROP COLUMN IF EXISTS "created"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cad_lieux_dits" DROP COLUMN IF EXISTS "updated"`,
    );
    await queryRunner.query(
      `ALTER TABLE "admin_regions" DROP CONSTRAINT IF EXISTS "admin_regions_pkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "admin_regions" DROP COLUMN IF EXISTS "ogc_fid"`,
    );
    await queryRunner.query(
      `ALTER TABLE "admin_departments" DROP CONSTRAINT IF EXISTS "admin_departments_pkey"`,
    );
    await queryRunner.query(
      `ALTER TABLE "admin_departments" DROP COLUMN IF EXISTS "ogc_fid"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cad_communes" DROP CONSTRAINT IF EXISTS "cad_communes_pkey"`,
    );
    await queryRunner.query(`ALTER TABLE "cad_communes" DROP COLUMN IF EXISTS "ogc_fid"`);
    await queryRunner.query(`ALTER TABLE "cad_communes" DROP COLUMN IF EXISTS "created"`);
    await queryRunner.query(`ALTER TABLE "cad_communes" DROP COLUMN IF EXISTS "updated"`);
    await queryRunner.query(
      `ALTER TABLE "cad_lieux_dits" ALTER COLUMN "ogc_fid" DROP DEFAULT`,
    );
    await queryRunner.query(`DROP SEQUENCE IF EXISTS "cad_lieux_dits_ogc_fid_seq"`);
    await queryRunner.query(
      `ALTER TABLE "cad_lieux_dits" ALTER COLUMN "nom" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "cad_lieux_dits" ALTER COLUMN "commune" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "cad_lieux_dits" ALTER COLUMN "geom" TYPE geometry`,
    );
    await queryRunner.query(
      `ALTER TABLE "admin_regions" ALTER COLUMN "code_insee" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "admin_regions" ADD CONSTRAINT "PK_90d5668e2a1339593db18f76c95" PRIMARY KEY ("code_insee")`,
    );
    await queryRunner.query(
      `ALTER TABLE "admin_regions" ALTER COLUMN "nom_officiel" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "admin_regions" ALTER COLUMN "geom" TYPE geometry`,
    );
    await queryRunner.query(
      `ALTER TABLE "admin_departments" ALTER COLUMN "code_insee" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "admin_departments" ADD CONSTRAINT "PK_bced5cd601e680cc78b42a06107" PRIMARY KEY ("code_insee")`,
    );
    await queryRunner.query(
      `ALTER TABLE "admin_departments" ALTER COLUMN "code_insee_de_la_region" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "admin_departments" ALTER COLUMN "nom_officiel" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "admin_departments" ALTER COLUMN "geom" TYPE geometry`,
    );
    await queryRunner.query(
      `ALTER TABLE "cad_communes" ALTER COLUMN "id" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "cad_communes" ADD CONSTRAINT "PK_edfd68b78bc2f72b7b11fb1e467" PRIMARY KEY ("id")`,
    );
    await queryRunner.query(
      `ALTER TABLE "cad_communes" ALTER COLUMN "nom" SET NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "cad_communes" ALTER COLUMN "geom" TYPE geometry`,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_092d919683d76e26a4f64886f8" ON "cad_lieux_dits" ("commune") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_b921ecef4909c83a2f4090057c" ON "cad_lieux_dits" USING GiST ("geom") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_46d47b6894ec5c6d03d47c8d78" ON "admin_regions" USING GiST ("geom") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_d23de2f0782a4e91dca4cfc6f0" ON "admin_departments" ("code_insee_de_la_region") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_d0228929224be927efc7f789e7" ON "admin_departments" USING GiST ("geom") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "IDX_e2c06ce379b1f6ceb382f8b2f3" ON "cad_communes" USING GiST ("geom") `,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_e2c06ce379b1f6ceb382f8b2f3"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_d0228929224be927efc7f789e7"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_d23de2f0782a4e91dca4cfc6f0"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_46d47b6894ec5c6d03d47c8d78"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_b921ecef4909c83a2f4090057c"`,
    );
    await queryRunner.query(
      `DROP INDEX IF EXISTS "public"."IDX_092d919683d76e26a4f64886f8"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cad_communes" ALTER COLUMN "geom" TYPE geometry(MULTIPOLYGON,2154)`,
    );
    await queryRunner.query(
      `ALTER TABLE "cad_communes" ALTER COLUMN "nom" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "cad_communes" DROP CONSTRAINT IF EXISTS "PK_edfd68b78bc2f72b7b11fb1e467"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cad_communes" ALTER COLUMN "id" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "admin_departments" ALTER COLUMN "geom" TYPE geometry(MULTIPOLYGON,0)`,
    );
    await queryRunner.query(
      `ALTER TABLE "admin_departments" ALTER COLUMN "nom_officiel" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "admin_departments" ALTER COLUMN "code_insee_de_la_region" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "admin_departments" DROP CONSTRAINT IF EXISTS "PK_bced5cd601e680cc78b42a06107"`,
    );
    await queryRunner.query(
      `ALTER TABLE "admin_departments" ALTER COLUMN "code_insee" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "admin_regions" ALTER COLUMN "geom" TYPE geometry(MULTIPOLYGON,0)`,
    );
    await queryRunner.query(
      `ALTER TABLE "admin_regions" ALTER COLUMN "nom_officiel" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "admin_regions" DROP CONSTRAINT IF EXISTS "PK_90d5668e2a1339593db18f76c95"`,
    );
    await queryRunner.query(
      `ALTER TABLE "admin_regions" ALTER COLUMN "code_insee" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "cad_lieux_dits" ALTER COLUMN "geom" TYPE geometry(MULTIPOLYGON,2154)`,
    );
    await queryRunner.query(
      `ALTER TABLE "cad_lieux_dits" ALTER COLUMN "commune" DROP NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "cad_lieux_dits" ALTER COLUMN "nom" DROP NOT NULL`,
    );
    await queryRunner.query(
      `CREATE SEQUENCE IF NOT EXISTS "cad_lieux_dits_ogc_fid_seq" OWNED BY "cad_lieux_dits"."ogc_fid"`,
    );
    await queryRunner.query(
      `ALTER TABLE "cad_lieux_dits" ALTER COLUMN "ogc_fid" SET DEFAULT nextval('"cad_lieux_dits_ogc_fid_seq"')`,
    );
    await queryRunner.query(`ALTER TABLE "cad_communes" ADD "updated" date`);
    await queryRunner.query(`ALTER TABLE "cad_communes" ADD "created" date`);
    await queryRunner.query(
      `ALTER TABLE "cad_communes" ADD "ogc_fid" SERIAL NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "cad_communes" ADD CONSTRAINT "cad_communes_pkey" PRIMARY KEY ("ogc_fid")`,
    );
    await queryRunner.query(
      `ALTER TABLE "admin_departments" ADD "ogc_fid" SERIAL NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "admin_departments" ADD CONSTRAINT "admin_departments_pkey" PRIMARY KEY ("ogc_fid")`,
    );
    await queryRunner.query(
      `ALTER TABLE "admin_regions" ADD "ogc_fid" SERIAL NOT NULL`,
    );
    await queryRunner.query(
      `ALTER TABLE "admin_regions" ADD CONSTRAINT "admin_regions_pkey" PRIMARY KEY ("ogc_fid")`,
    );
    await queryRunner.query(`ALTER TABLE "cad_lieux_dits" ADD "updated" date`);
    await queryRunner.query(`ALTER TABLE "cad_lieux_dits" ADD "created" date`);
    await queryRunner.query(`DROP TABLE IF EXISTS "users"`);
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "cad_communes_id_idx" ON "cad_communes" ("id") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "cad_communes_geom_idx" ON "cad_communes" USING GiST ("geom") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "cad_communes_geom_geom_idx" ON "cad_communes" USING GiST ("geom") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "admin_departments_code_insee_de_la_region_idx" ON "admin_departments" ("code_insee_de_la_region") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "admin_departments_code_insee_idx" ON "admin_departments" ("code_insee") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "admin_departments_geom_idx" ON "admin_departments" USING GiST ("geom") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "admin_departments_geom_geom_idx" ON "admin_departments" USING GiST ("geom") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "admin_regions_code_insee_idx" ON "admin_regions" ("code_insee") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "admin_regions_geom_idx" ON "admin_regions" USING GiST ("geom") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "admin_regions_geom_geom_idx" ON "admin_regions" USING GiST ("geom") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "cad_lieux_dits_commune_idx" ON "cad_lieux_dits" ("commune") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "cad_lieux_dits_geom_idx" ON "cad_lieux_dits" USING GiST ("geom") `,
    );
    await queryRunner.query(
      `CREATE INDEX IF NOT EXISTS "cad_lieux_dits_geom_geom_idx" ON "cad_lieux_dits" USING GiST ("geom") `,
    );
  }
}
