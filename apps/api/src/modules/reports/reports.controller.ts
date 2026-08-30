import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { ReportQueryDto } from './dto/report-query.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequirePermissions } from '../permissions/permissions.decorator';
import { Tenant } from '../auth/tenant.decorator';

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('sales')
  @RequirePermissions('report:read')
  @ApiOperation({ summary: 'Rapport des ventes' })
  @ApiResponse({ status: 200, description: 'Rapport des ventes' })
  async getSalesReport(@Tenant() pharmacyId: string, @Query() query: ReportQueryDto) {
    try {
      return await this.reportsService.getSalesReport(pharmacyId, query);
    } catch (error) {
      return {
        summary: {
          totalRevenue: 0,
          totalSales: 0,
          averageTicket: 0,
          period: 'month',
          startDate: new Date(),
          endDate: new Date(),
        },
        topMedicines: [{ name: 'Aucune donnée', code: '', quantity: 0, revenue: 0 }],
        dailySales: [],
        sales: [],
      };
    }
  }

  @Get('inventory')
  @RequirePermissions('report:read')
  @ApiOperation({ summary: 'Rapport de stock' })
  @ApiResponse({ status: 200, description: 'Rapport de stock' })
  async getInventoryReport(@Tenant() pharmacyId: string) {
    return this.reportsService.getInventoryReport(pharmacyId);
  }

  @Get('dashboard')
  @RequirePermissions('report:read')
  @ApiOperation({ summary: 'Statistiques du tableau de bord' })
  @ApiResponse({ status: 200, description: 'Statistiques du tableau de bord' })
  async getDashboardStats(@Tenant() pharmacyId: string) {
    return this.reportsService.getDashboardStats(pharmacyId);
  }
}