import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { GenericNamesService } from './generic-names.service';
import { CreateGenericNameDto } from './dto/create-generic-name.dto';
import { UpdateGenericNameDto } from './dto/update-generic-name.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequirePermissions } from '../permissions/permissions.decorator';
import { Tenant } from '../auth/tenant.decorator';

@ApiTags('Generic Names')
@ApiBearerAuth()
@Controller('generic-names')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class GenericNamesController {
  constructor(private readonly genericNamesService: GenericNamesService) {}

  @Post()
  @RequirePermissions('medicine:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un nouveau nom générique' })
  @ApiResponse({ status: 201, description: 'Nom générique créé avec succès' })
  @ApiResponse({ status: 409, description: 'Un nom générique avec ce nom existe déjà' })
  async create(
    @Body() createGenericNameDto: CreateGenericNameDto,
    @Tenant() pharmacyId: string,
  ) {
    return this.genericNamesService.create(createGenericNameDto, pharmacyId);
  }

  @Get()
  @RequirePermissions('medicine:read')
  @ApiOperation({ summary: 'Récupérer tous les noms génériques' })
  @ApiResponse({ status: 200, description: 'Liste des noms génériques' })
  async findAll(@Tenant() pharmacyId: string) {
    return this.genericNamesService.findAll(pharmacyId);
  }

  @Get(':id')
  @RequirePermissions('medicine:read')
  @ApiOperation({ summary: 'Récupérer un nom générique par ID' })
  @ApiResponse({ status: 200, description: 'Nom générique trouvé' })
  @ApiResponse({ status: 404, description: 'Nom générique non trouvé' })
  async findOne(@Param('id') id: string, @Tenant() pharmacyId: string) {
    return this.genericNamesService.findOne(id, pharmacyId);
  }

  @Patch(':id')
  @RequirePermissions('medicine:update')
  @ApiOperation({ summary: 'Mettre à jour un nom générique' })
  @ApiResponse({ status: 200, description: 'Nom générique mis à jour' })
  @ApiResponse({ status: 404, description: 'Nom générique non trouvé' })
  @ApiResponse({ status: 409, description: 'Un nom générique avec ce nom existe déjà' })
  async update(
    @Param('id') id: string,
    @Tenant() pharmacyId: string,
    @Body() updateGenericNameDto: UpdateGenericNameDto,
  ) {
    return this.genericNamesService.update(id, pharmacyId, updateGenericNameDto);
  }

  @Delete(':id')
  @RequirePermissions('medicine:delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer un nom générique' })
  @ApiResponse({ status: 200, description: 'Nom générique supprimé' })
  @ApiResponse({ status: 404, description: 'Nom générique non trouvé' })
  @ApiResponse({ status: 409, description: 'Nom générique utilisé par des médicaments' })
  async remove(@Param('id') id: string, @Tenant() pharmacyId: string) {
    return this.genericNamesService.remove(id, pharmacyId);
  }
}