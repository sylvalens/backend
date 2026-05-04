import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AdminRegion } from './entities/admin-region.entity';
import { AdminDepartment } from './entities/admin-department.entity';
import { Commune } from './entities/commune.entity';
import { LieuDit } from './entities/lieu-dit.entity';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(AdminRegion)
    private readonly regionRepo: Repository<AdminRegion>,
    @InjectRepository(AdminDepartment)
    private readonly deptRepo: Repository<AdminDepartment>,
    @InjectRepository(Commune)
    private readonly communeRepo: Repository<Commune>,
    @InjectRepository(LieuDit)
    private readonly lieuDitRepo: Repository<LieuDit>,
  ) {}

  async findAllRegions(): Promise<AdminRegion[]> {
    return this.regionRepo.find({
      order: { nomOfficiel: 'ASC' },
    });
  }

  async findDepartmentsByRegion(
    regionCode: string,
  ): Promise<AdminDepartment[]> {
    return this.deptRepo.find({
      where: { codeInseeRegion: regionCode },
      order: { nomOfficiel: 'ASC' },
    });
  }

  async findCommunesByDepartment(departmentCode: string): Promise<Commune[]> {
    return this.communeRepo
      .createQueryBuilder('c')
      .where('LEFT(c.id, 2) = :deptCode', { deptCode: departmentCode })
      .orderBy('c.name', 'ASC')
      .getMany();
  }

  async findLieuxDitsByCommune(communeId: string): Promise<LieuDit[]> {
    // communeId like "68001"
    return this.lieuDitRepo.find({
      where: { communeId },
      order: { name: 'ASC' },
      take: 500,
    });
  }

  async searchCommunes(query: string): Promise<Commune[]> {
    return this.communeRepo
      .createQueryBuilder('c')
      .where('c.name ILIKE :query', { query: `%${query}%` })
      .orderBy('c.name', 'ASC')
      .take(10)
      .getMany();
  }

  async searchLieuxDits(query: string): Promise<LieuDit[]> {
    return this.lieuDitRepo
      .createQueryBuilder('ld')
      .where('ld.name ILIKE :query', { query: `%${query}%` })
      .orderBy('ld.name', 'ASC')
      .take(10)
      .getMany();
  }
}
