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
import { ManufacturersService } from './manufacturers.service';
import { CreateManufacturerDto } from './dto/create-manufacturer.dto';
import { UpdateManufacturerDto } from './dto/update-manufacturer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequirePermissions } from '../permissions/permissions.decorator';
import { Tenant } from '../auth/tenant.decorator';

@ApiTags('Manufacturers')
@ApiBearerAuth()
@Controller('manufacturers')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class ManufacturersController {
  constructor(private readonly manufacturersService: ManufacturersService) {}

  @Post()
  @RequirePermissions('manufacturer:create')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Créer un nouveau fabricant' })
  @ApiResponse({ status: 201, description: 'Fabricant créé avec succès' })
  @ApiResponse({ status: 409, description: 'Un fabricant avec ce nom existe déjà' })
  async create(@Body() createManufacturerDto: CreateManufacturerDto) {
    return this.manufacturersService.create(createManufacturerDto);
  }

  @Get()
  @RequirePermissions('manufacturer:read')
  @ApiOperation({ summary: 'Récupérer tous les fabricants' })
  @ApiResponse({ status: 200, description: 'Liste des fabricants' })
  @ApiQuery({ name: 'search', required: false, description: 'Recherche par nom, pays ou email' })
  async findAll(@Tenant() pharmacyId: string, @Query('search') search?: string) {
    return this.manufacturersService.findAll(pharmacyId, search);
  }

  @Get(':id')
  @RequirePermissions('manufacturer:read')
  @ApiOperation({ summary: 'Récupérer un fabricant par ID' })
  @ApiResponse({ status: 200, description: 'Fabricant trouvé' })
  @ApiResponse({ status: 404, description: 'Fabricant non trouvé' })
  async findOne(@Param('id') id: string, @Tenant() pharmacyId: string) {
    return this.manufacturersService.findOne(id, pharmacyId);
  }

  @Patch(':id')
  @RequirePermissions('manufacturer:update')
  @ApiOperation({ summary: 'Mettre à jour un fabricant' })
  @ApiResponse({ status: 200, description: 'Fabricant mis à jour' })
  @ApiResponse({ status: 404, description: 'Fabricant non trouvé' })
  @ApiResponse({ status: 409, description: 'Un fabricant avec ce nom existe déjà' })
  async update(
    @Param('id') id: string,
    @Tenant() pharmacyId: string,
    @Body() updateManufacturerDto: UpdateManufacturerDto,
  ) {
    return this.manufacturersService.update(id, pharmacyId, updateManufacturerDto);
  }

  @Delete(':id')
  @RequirePermissions('manufacturer:delete')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Supprimer un fabricant' })
  @ApiResponse({ status: 200, description: 'Fabricant supprimé' })
  @ApiResponse({ status: 404, description: 'Fabricant non trouvé' })
  @ApiResponse({ status: 409, description: 'Fabricant utilisé par des médicaments' })
  async remove(@Param('id') id: string, @Tenant() pharmacyId: string) {
    return this.manufacturersService.remove(id, pharmacyId);
  }
}