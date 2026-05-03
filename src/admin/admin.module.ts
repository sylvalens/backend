import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminRegion } from './entities/admin-region.entity';
import { AdminDepartment } from './entities/admin-department.entity';
import { Commune } from './entities/commune.entity';
import { LieuDit } from './entities/lieu-dit.entity';
import { AdminService } from './admin.service';
import { AdminController } from './admin.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([AdminRegion, AdminDepartment, Commune, LieuDit]),
  ],
  providers: [AdminService],
  controllers: [AdminController],
  exports: [AdminService],
})
export class AdminModule {}
