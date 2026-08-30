import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { InventoryService } from './inventory.service';
import { AdjustStockDto } from './dto/adjust-stock.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequirePermissions } from '../permissions/permissions.decorator';
import { Tenant } from '../auth/tenant.decorator';

@ApiTags('Inventory')
@ApiBearerAuth()
@Controller('inventory')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('summary')
  @RequirePermissions('inventory:read')
  @ApiOperation({ summary: 'Résumé du stock' })
  async getStockSummary(@Tenant() pharmacyId: string) {
    return this.inventoryService.getStockSummary(pharmacyId);
  }

  @Get('movements')
  @RequirePermissions('inventory:read')
  @ApiOperation({ summary: 'Historique des mouvements de stock' })
  @ApiQuery({ name: 'medicineId', required: false })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'offset', required: false, type: Number })
  async getMovements(
    @Tenant() pharmacyId: string,
    @Query('medicineId') medicineId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.inventoryService.getMovements(
      pharmacyId,
      medicineId,
      limit ? parseInt(limit) : 50,
      offset ? parseInt(offset) : 0,
    );
  }

  @Post('adjust')
  @RequirePermissions('inventory:adjust')
  @ApiOperation({ summary: 'Ajuster le stock d\'un médicament' })
  @ApiResponse({ status: 201, description: 'Stock ajusté avec succès' })
  async adjustStock(
    @Body() adjustStockDto: AdjustStockDto,
    @Request() req: any,
    @Tenant() pharmacyId: string,
  ) {
    return this.inventoryService.adjustStock(adjustStockDto, req.user.id, pharmacyId);
  }

  @Get('alerts')
  @RequirePermissions('inventory:read')
  @ApiOperation({ summary: 'Alertes de stock faible' })
  async getLowStockAlerts(@Tenant() pharmacyId: string) {
    return this.inventoryService.getLowStockAlerts(pharmacyId);
  }
}