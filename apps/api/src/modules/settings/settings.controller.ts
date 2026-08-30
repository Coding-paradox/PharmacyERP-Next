import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SettingsService } from './settings.service';
import { UpdatePharmacyDto } from './dto/update-pharmacy.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequirePermissions } from '../permissions/permissions.decorator';
import { Tenant } from '../auth/tenant.decorator';

@ApiTags('Settings')
@ApiBearerAuth()
@Controller('settings')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get('pharmacy')
  @RequirePermissions('settings:read')
  @ApiOperation({ summary: 'Récupérer les paramètres de la pharmacie' })
  @ApiResponse({ status: 200, description: 'Paramètres récupérés' })
  async getPharmacySettings(@Tenant() pharmacyId: string) {
    return this.settingsService.getPharmacySettings(pharmacyId);
  }

  @Patch('pharmacy')
  @RequirePermissions('settings:update')
  @ApiOperation({ summary: 'Mettre à jour les paramètres de la pharmacie' })
  @ApiResponse({ status: 200, description: 'Paramètres mis à jour' })
  async updatePharmacySettings(
    @Tenant() pharmacyId: string,
    @Body() updatePharmacyDto: UpdatePharmacyDto,
  ) {
    return this.settingsService.updatePharmacySettings(pharmacyId, updatePharmacyDto);
  }

  @Get('system-info')
  @RequirePermissions('settings:read')
  @ApiOperation({ summary: 'Récupérer les informations système' })
  @ApiResponse({ status: 200, description: 'Informations système' })
  async getSystemInfo(@Tenant() pharmacyId: string) {
    return this.settingsService.getSystemInfo(pharmacyId);
  }
}