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
import { PurchasesService } from './purchases.service';
import { CreatePurchaseDto } from './dto/create-purchase.dto';
import { UpdatePurchaseDto } from './dto/update-purchase.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequirePermissions } from '../permissions/permissions.decorator';
import { Tenant } from '../auth/tenant.decorator';

@ApiTags('Purchases')
@ApiBearerAuth()
@Controller('purchases')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class PurchasesController {
  constructor(private readonly purchasesService: PurchasesService) {}

  @Post()
  @RequirePermissions('purchase:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer une commande d\'achat' })
  @ApiResponse({ status: 201, description: 'Commande créée avec succès' })
  async create(
    @Body() createPurchaseDto: CreatePurchaseDto,
    @Request() req: any,
    @Tenant() pharmacyId: string,
  ) {
    return this.purchasesService.create(createPurchaseDto, req.user.id, pharmacyId);
  }

  @Get()
  @RequirePermissions('purchase:read')
  @ApiOperation({ summary: 'Récupérer toutes les commandes d\'achat' })
  @ApiResponse({ status: 200, description: 'Liste des commandes' })
  @ApiQuery({ name: 'status', required: false, description: 'Filtrer par statut' })
  @ApiQuery({ name: 'search', required: false, description: 'Recherche par numéro ou fournisseur' })
  async findAll(
    @Tenant() pharmacyId: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.purchasesService.findAll(pharmacyId, status, search);
  }

  @Get(':id')
  @RequirePermissions('purchase:read')
  @ApiOperation({ summary: 'Récupérer une commande par ID' })
  @ApiResponse({ status: 200, description: 'Commande trouvée' })
  @ApiResponse({ status: 404, description: 'Commande non trouvée' })
  async findOne(@Param('id') id: string, @Tenant() pharmacyId: string) {
    return this.purchasesService.findOne(id, pharmacyId);
  }

  @Patch(':id')
  @RequirePermissions('purchase:update')
  @ApiOperation({ summary: 'Mettre à jour une commande' })
  @ApiResponse({ status: 200, description: 'Commande mise à jour' })
  @ApiResponse({ status: 404, description: 'Commande non trouvée' })
  async update(
    @Param('id') id: string,
    @Tenant() pharmacyId: string,
    @Body() updatePurchaseDto: UpdatePurchaseDto,
  ) {
    return this.purchasesService.update(id, pharmacyId, updatePurchaseDto);
  }

  @Delete(':id')
  @RequirePermissions('purchase:delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer une commande' })
  @ApiResponse({ status: 200, description: 'Commande supprimée' })
  @ApiResponse({ status: 404, description: 'Commande non trouvée' })
  async remove(@Param('id') id: string, @Tenant() pharmacyId: string) {
    return this.purchasesService.remove(id, pharmacyId);
  }

  @Post(':id/receive')
  @RequirePermissions('purchase:receive')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Réceptionner une commande et mettre à jour le stock' })
  @ApiResponse({ status: 200, description: 'Commande réceptionnée' })
  @ApiResponse({ status: 404, description: 'Commande non trouvée' })
  async receive(@Param('id') id: string, @Tenant() pharmacyId: string) {
    return this.purchasesService.receive(id, pharmacyId);
  }
}