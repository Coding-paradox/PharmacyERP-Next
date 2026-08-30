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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { SuppliersService } from './suppliers.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';
import { UpdateSupplierDto } from './dto/update-supplier.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequirePermissions } from '../permissions/permissions.decorator';
import { Tenant } from '../auth/tenant.decorator';

@ApiTags('Suppliers')
@ApiBearerAuth()
@Controller('suppliers')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SuppliersController {
  constructor(private readonly suppliersService: SuppliersService) {}

  @Post()
  @RequirePermissions('supplier:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un nouveau fournisseur' })
  @ApiResponse({ status: 201, description: 'Fournisseur créé avec succès' })
  @ApiResponse({ status: 409, description: 'Un fournisseur avec ce nom existe déjà' })
  async create(@Body() createSupplierDto: CreateSupplierDto) {
    return this.suppliersService.create(createSupplierDto);
  }

  @Get()
  @RequirePermissions('supplier:read')
  @ApiOperation({ summary: 'Récupérer tous les fournisseurs' })
  @ApiResponse({ status: 200, description: 'Liste des fournisseurs' })
  @ApiQuery({ name: 'search', required: false, description: 'Recherche par nom, email ou téléphone' })
  async findAll(@Tenant() pharmacyId: string, @Query('search') search?: string) {
    return this.suppliersService.findAll(pharmacyId, search);
  }

  @Get(':id')
  @RequirePermissions('supplier:read')
  @ApiOperation({ summary: 'Récupérer un fournisseur par ID' })
  @ApiResponse({ status: 200, description: 'Fournisseur trouvé' })
  @ApiResponse({ status: 404, description: 'Fournisseur non trouvé' })
  async findOne(@Param('id') id: string, @Tenant() pharmacyId: string) {
    return this.suppliersService.findOne(id, pharmacyId);
  }

  @Patch(':id')
  @RequirePermissions('supplier:update')
  @ApiOperation({ summary: 'Mettre à jour un fournisseur' })
  @ApiResponse({ status: 200, description: 'Fournisseur mis à jour' })
  @ApiResponse({ status: 404, description: 'Fournisseur non trouvé' })
  @ApiResponse({ status: 409, description: 'Un fournisseur avec ce nom existe déjà' })
  async update(
    @Param('id') id: string,
    @Tenant() pharmacyId: string,
    @Body() updateSupplierDto: UpdateSupplierDto,
  ) {
    return this.suppliersService.update(id, pharmacyId, updateSupplierDto);
  }

  @Delete(':id')
  @RequirePermissions('supplier:delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer un fournisseur' })
  @ApiResponse({ status: 200, description: 'Fournisseur supprimé' })
  @ApiResponse({ status: 404, description: 'Fournisseur non trouvé' })
  @ApiResponse({ status: 409, description: 'Fournisseur utilisé par des commandes d\'achat' })
  async remove(@Param('id') id: string, @Tenant() pharmacyId: string) {
    return this.suppliersService.remove(id, pharmacyId);
  }
}