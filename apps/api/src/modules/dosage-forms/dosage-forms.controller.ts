import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { DosageFormsService } from './dosage-forms.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../permissions/permissions.guard';
import { RequirePermissions } from '../permissions/permissions.decorator';
import { Tenant } from '../auth/tenant.decorator';

@ApiTags('Dosage Forms')
@ApiBearerAuth()
@Controller('dosage-forms')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class DosageFormsController {
  constructor(private readonly dosageFormsService: DosageFormsService) {}

  @Get()
  @RequirePermissions('medicine:read')
  @ApiOperation({ summary: 'Récupérer toutes les formes galéniques' })
  async findAll(@Tenant() pharmacyId: string) {
    return this.dosageFormsService.findAll(pharmacyId);
  }
}