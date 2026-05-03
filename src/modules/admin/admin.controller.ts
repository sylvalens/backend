import { Controller, Get, Query } from '@nestjs/common';
import { AdminService } from './admin.service';
import { AdminRegion } from './entities/admin-region.entity';
import { AdminDepartment } from './entities/admin-department.entity';
import { Commune } from './entities/commune.entity';
import { LieuDit } from './entities/lieu-dit.entity';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('regions')
  async getRegions(): Promise<AdminRegion[]> {
    return this.adminService.findAllRegions();
  }

  @Get('departments')
  async getDepartments(
    @Query('regionCode') regionCode?: string,
  ): Promise<AdminDepartment[]> {
    if (!regionCode) {
      throw new Error('regionCode query parameter is required');
    }
    return this.adminService.findDepartmentsByRegion(regionCode);
  }

  @Get('communes')
  async getCommunes(
    @Query('departmentCode') departmentCode?: string,
  ): Promise<Commune[]> {
    if (!departmentCode) {
      throw new Error('departmentCode query parameter is required');
    }
    return this.adminService.findCommunesByDepartment(departmentCode);
  }

  @Get('lieux-dits')
  async getLieuxDits(
    @Query('communeId') communeId?: string,
  ): Promise<Array<{ id: number; name: string; communeId: string }>> {
    if (!communeId) {
      throw new Error('communeId query parameter is required');
    }

    const list = await this.adminService.findLieuxDitsByCommune(communeId);
    return list.map((ld) => ({
      id: ld.id,
      name: ld.name,
      communeId: ld.communeId,
    }));
  }

  @Get('search')
  async search(@Query('q') query: string) {
    if (!query || query.length < 2) {
      return { communes: [], lieuxDits: [] };
    }

    const [communes, lieuxDits] = await Promise.all([
      this.adminService.searchCommunes(query),
      this.adminService.searchLieuxDits(query),
    ]);

    return {
      communes: communes.map(c => ({ id: c.id, name: c.name })),
      lieuxDits: lieuxDits.map(ld => ({ id: ld.id, name: ld.name, communeId: ld.communeId })),
    };
  }
}
