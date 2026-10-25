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
import { UnitsService } from './units.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequirePermissions } from '../permissions/permissions.decorator';
import { Tenant } from '../auth/tenant.decorator';

@ApiTags('Units')
@ApiBearerAuth()
@Controller('units')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class UnitsController {
  constructor(private readonly unitsService: UnitsService) {}

  @Post()
  @RequirePermissions('unit:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer une nouvelle unité' })
  @ApiResponse({ status: 201, description: 'Unité créée avec succès' })
  @ApiResponse({ status: 409, description: 'Une unité avec ce nom existe déjà' })
  async create(
    @Body() createUnitDto: CreateUnitDto,
    @Tenant() pharmacyId: string,
  ) {
    return this.unitsService.create(createUnitDto, pharmacyId);
  }

  @Get()
  @RequirePermissions('unit:read')
  @ApiOperation({ summary: 'Récupérer toutes les unités' })
  @ApiResponse({ status: 200, description: 'Liste des unités' })
  @ApiQuery({ name: 'search', required: false, description: 'Recherche par nom ou symbole' })
  async findAll(@Tenant() pharmacyId: string, @Query('search') search?: string) {
    return this.unitsService.findAll(pharmacyId, search);
  }

  @Get(':id')
  @RequirePermissions('unit:read')
  @ApiOperation({ summary: 'Récupérer une unité par ID' })
  @ApiResponse({ status: 200, description: 'Unité trouvée' })
  @ApiResponse({ status: 404, description: 'Unité non trouvée' })
  async findOne(@Param('id') id: string, @Tenant() pharmacyId: string) {
    return this.unitsService.findOne(id, pharmacyId);
  }

  @Patch(':id')
  @RequirePermissions('unit:update')
  @ApiOperation({ summary: 'Mettre à jour une unité' })
  @ApiResponse({ status: 200, description: 'Unité mise à jour' })
  @ApiResponse({ status: 404, description: 'Unité non trouvée' })
  @ApiResponse({ status: 409, description: 'Une unité avec ce nom existe déjà' })
  async update(
    @Param('id') id: string,
    @Tenant() pharmacyId: string,
    @Body() updateUnitDto: UpdateUnitDto,
  ) {
    return this.unitsService.update(id, pharmacyId, updateUnitDto);
  }

  @Delete(':id')
  @RequirePermissions('unit:delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer une unité' })
  @ApiResponse({ status: 200, description: 'Unité supprimée' })
  @ApiResponse({ status: 404, description: 'Unité non trouvée' })
  @ApiResponse({ status: 409, description: 'Unité utilisée par des médicaments' })
  async remove(@Param('id') id: string, @Tenant() pharmacyId: string) {
    return this.unitsService.remove(id, pharmacyId);
  }
}