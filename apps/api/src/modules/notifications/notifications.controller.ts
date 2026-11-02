import { Body, Controller, Delete, Get, Param, Patch, Post, Req, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Tenant } from '../auth/tenant.decorator';
import { NotificationsService } from './notifications.service';
import { PushSubscriptionDto, RemovePushSubscriptionDto } from './dto/push-subscription.dto';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notifications: NotificationsService) {}

  @Get()
  @ApiOperation({ summary: 'Notifications de l’utilisateur connecté' })
  list(@Req() req: any, @Tenant() pharmacyId: string) {
    return this.notifications.list(req.user.id, pharmacyId);
  }

  @Patch(':id/read')
  @ApiOperation({ summary: 'Marquer une notification comme lue' })
  markRead(@Param('id') id: string, @Req() req: any, @Tenant() pharmacyId: string) {
    return this.notifications.markRead(id, req.user.id, pharmacyId);
  }

  @Post('read-all')
  @ApiOperation({ summary: 'Tout marquer comme lu' })
  markAllRead(@Req() req: any, @Tenant() pharmacyId: string) {
    return this.notifications.markAllRead(req.user.id, pharmacyId);
  }

  @Get('push/config')
  @ApiOperation({ summary: 'Clé publique du serveur push' })
  pushConfig() {
    return this.notifications.getPushConfig();
  }

  @Post('push/subscriptions')
  @ApiOperation({ summary: 'Enregistrer cet appareil pour les notifications push' })
  subscribe(@Body() dto: PushSubscriptionDto, @Req() req: any, @Tenant() pharmacyId: string) {
    return this.notifications.savePushSubscription(dto, req.user.id, pharmacyId);
  }

  @Delete('push/subscriptions')
  @ApiOperation({ summary: 'Désactiver les notifications push sur cet appareil' })
  unsubscribe(@Body() dto: RemovePushSubscriptionDto, @Req() req: any, @Tenant() pharmacyId: string) {
    return this.notifications.removePushSubscription(dto.endpoint, req.user.id, pharmacyId);
  }
}
