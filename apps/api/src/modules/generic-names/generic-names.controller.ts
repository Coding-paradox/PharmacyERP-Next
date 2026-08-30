import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { GenericNamesService } from './generic-names.service';
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

  @Get()
  @RequirePermissions('medicine:read')
  @ApiOperation({ summary: 'Récupérer tous les noms génériques' })
  async findAll(@Tenant() pharmacyId: string) {
    return this.genericNamesService.findAll(pharmacyId);
  }
}