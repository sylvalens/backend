import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HealthController } from './health.controller';
import { AdminModule } from './modules/admin/admin.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { MapModule } from './modules/map/map.module';
import { RasterModule } from './modules/raster/raster.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (cfg: ConfigService) => ({
        type: 'postgres',
        host: cfg.get('DB_HOST') || 'localhost',
        port: parseInt(cfg.get('DB_PORT') || '5432', 10),
        username: cfg.get('DB_USER') || 'forest',
        password: cfg.get('DB_PASS') || 'forest',
        database: cfg.get('DB_NAME') || 'forest',
        autoLoadEntities: true,
        synchronize: false, // <-- now OFF, we use the existing schema
      }),
    }),
    AdminModule,
    UsersModule,
    AuthModule,
    MapModule,
    RasterModule,
  ],
  controllers: [HealthController],
})
export class AppModule {}
