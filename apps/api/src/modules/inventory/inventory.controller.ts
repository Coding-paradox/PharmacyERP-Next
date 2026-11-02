import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  UseGuards,
  Request,
  Param,
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
import { CompleteStocktakeDto } from './dto/complete-stocktake.dto';
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
    const parsedLimit = limit && /^\d+$/.test(limit) ? Number(limit) : 50;
    const parsedOffset = offset && /^\d+$/.test(offset) ? Number(offset) : 0;
    return this.inventoryService.getMovements(
      pharmacyId,
      medicineId,
      Math.min(Math.max(parsedLimit, 1), 100),
      Math.min(parsedOffset, 100_000),
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

  @Get('expiry-alerts')
  @RequirePermissions('inventory:read')
  @ApiOperation({ summary: 'Lots périmés ou proches de la péremption' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  async getExpiryAlerts(@Tenant() pharmacyId: string, @Query('days') days?: string) {
    const parsedDays = days && /^\d+$/.test(days) ? Number(days) : 90;
    return this.inventoryService.getExpiryAlerts(pharmacyId, Math.min(Math.max(parsedDays, 1), 365));
  }

  @Get('stocktakes')
  @RequirePermissions('inventory:read')
  @ApiOperation({ summary: 'Sessions récentes d’inventaire physique' })
  async listStocktakes(@Tenant() pharmacyId: string) {
    return this.inventoryService.listStocktakes(pharmacyId);
  }

  @Post('stocktakes')
  @RequirePermissions('inventory:adjust')
  @ApiOperation({ summary: 'Ouvrir une session de comptage physique' })
  async createStocktake(@Request() req: any, @Tenant() pharmacyId: string) {
    return this.inventoryService.createStocktake(req.user.id, pharmacyId);
  }

  @Get('stocktakes/:id')
  @RequirePermissions('inventory:read')
  @ApiOperation({ summary: 'Détail d’une session de comptage' })
  async getStocktake(@Param('id') id: string, @Tenant() pharmacyId: string) {
    return this.inventoryService.getStocktake(id, pharmacyId);
  }

  @Post('stocktakes/:id/complete')
  @RequirePermissions('inventory:adjust')
  @ApiOperation({ summary: 'Valider un inventaire physique et appliquer les écarts' })
  async completeStocktake(
    @Param('id') id: string,
    @Body() dto: CompleteStocktakeDto,
    @Request() req: any,
    @Tenant() pharmacyId: string,
  ) {
    return this.inventoryService.completeStocktake(id, pharmacyId, req.user.id, dto);
  }

  @Post('stocktakes/:id/cancel')
  @RequirePermissions('inventory:adjust')
  @ApiOperation({ summary: 'Annuler une session de comptage ouverte' })
  async cancelStocktake(@Param('id') id: string, @Tenant() pharmacyId: string) {
    return this.inventoryService.cancelStocktake(id, pharmacyId);
  }
}
