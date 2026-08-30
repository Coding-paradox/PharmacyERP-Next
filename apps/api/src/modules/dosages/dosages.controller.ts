import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DosagesService } from './dosages.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequirePermissions } from '../permissions/permissions.decorator';
import { Tenant } from '../auth/tenant.decorator';

@ApiTags('Dosages')
@ApiBearerAuth()
@Controller('dosages')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DosagesController {
  constructor(private readonly dosagesService: DosagesService) {}

  @Get()
  @RequirePermissions('medicine:read')
  @ApiOperation({ summary: 'Récupérer tous les dosages' })
  async findAll(@Tenant() pharmacyId: string) {
    return this.dosagesService.findAll(pharmacyId);
  }
}