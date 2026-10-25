import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
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
import { SalesService } from './sales.service';
import { CreateSaleDto } from './dto/create-sale.dto';
import { UpdateSaleDto } from './dto/update-sale.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequirePermissions } from '../permissions/permissions.decorator';
import { Tenant } from '../auth/tenant.decorator';

@ApiTags('Sales')
@ApiBearerAuth()
@Controller('sales')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SalesController {
  constructor(private readonly salesService: SalesService) {}

  @Post()
  @RequirePermissions('sale:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer une vente' })
  @ApiResponse({ status: 201, description: 'Vente créée avec succès' })
  @ApiResponse({ status: 409, description: 'Stock insuffisant' })
  async create(
    @Body() createSaleDto: CreateSaleDto,
    @Request() req: any,
    @Tenant() pharmacyId: string,
  ) {
    return this.salesService.create(createSaleDto, req.user.id, pharmacyId);
  }

  @Get()
  @RequirePermissions('sale:read')
  @ApiOperation({ summary: 'Récupérer toutes les ventes' })
  @ApiResponse({ status: 200, description: 'Liste des ventes' })
  @ApiQuery({ name: 'status', required: false, description: 'Filtrer par statut' })
  @ApiQuery({ name: 'search', required: false, description: 'Recherche par numéro ou client' })
  async findAll(
    @Tenant() pharmacyId: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.salesService.findAll(pharmacyId, status, search);
  }

  @Get(':id')
  @RequirePermissions('sale:read')
  @ApiOperation({ summary: 'Récupérer une vente par ID' })
  @ApiResponse({ status: 200, description: 'Vente trouvée' })
  @ApiResponse({ status: 404, description: 'Vente non trouvée' })
  async findOne(@Param('id') id: string, @Tenant() pharmacyId: string) {
    return this.salesService.findOne(id, pharmacyId);
  }

  @Patch(':id')
  @RequirePermissions('sale:update')
  @ApiOperation({ summary: 'Mettre à jour une vente' })
  @ApiResponse({ status: 200, description: 'Vente mise à jour' })
  @ApiResponse({ status: 404, description: 'Vente non trouvée' })
  async update(
    @Param('id') id: string,
    @Tenant() pharmacyId: string,
    @Body() updateSaleDto: UpdateSaleDto,
  ) {
    return this.salesService.update(id, pharmacyId, updateSaleDto);
  }

  @Delete(':id')
  @RequirePermissions('sale:delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer une vente' })
  @ApiResponse({ status: 200, description: 'Vente supprimée' })
  @ApiResponse({ status: 404, description: 'Vente non trouvée' })
  async remove(@Param('id') id: string, @Tenant() pharmacyId: string) {
    return this.salesService.remove(id, pharmacyId);
  }

  @Post(':id/cancel')
  @RequirePermissions('sale:cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Annuler une vente et restaurer les stocks' })
  @ApiResponse({ status: 200, description: 'Vente annulée' })
  @ApiResponse({ status: 404, description: 'Vente non trouvée' })
  async cancel(@Param('id') id: string, @Tenant() pharmacyId: string) {
    return this.salesService.cancel(id, pharmacyId);
  }
}