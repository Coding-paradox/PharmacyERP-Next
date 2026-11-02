import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PrismaService } from '@pharmacy/database';
import { NotificationType, Prisma } from '@prisma/client';
import { PushSubscriptionDto } from './dto/push-subscription.dto';

@Injectable()
export class NotificationsService implements OnModuleInit {
  private readonly logger = new Logger(NotificationsService.name);
  private expiryTimer?: NodeJS.Timeout;
  private webPushConfigured = false;

  constructor(private readonly prisma: PrismaService) {}

  onModuleInit() {
    this.expiryTimer = setTimeout(() => {
      void this.createExpiryNotifications();
      this.expiryTimer = setInterval(() => void this.createExpiryNotifications(), 24 * 60 * 60 * 1000);
      this.expiryTimer.unref?.();
    }, 20_000);
    this.expiryTimer.unref?.();
  }

  async list(userId: string, pharmacyId: string) {
    const [items, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId, pharmacyId },
        orderBy: { createdAt: 'desc' },
        take: 40,
      }),
      this.prisma.notification.count({ where: { userId, pharmacyId, readAt: null } }),
    ]);
    return { items, unreadCount };
  }

  async markRead(id: string, userId: string, pharmacyId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { id, userId, pharmacyId, readAt: null },
      data: { readAt: new Date() },
    });
    return { success: result.count === 1 };
  }

  async markAllRead(userId: string, pharmacyId: string) {
    const result = await this.prisma.notification.updateMany({
      where: { userId, pharmacyId, readAt: null },
      data: { readAt: new Date() },
    });
    return { success: true, updated: result.count };
  }

  getPushConfig() {
    return { publicKey: process.env.VAPID_PUBLIC_KEY || null };
  }

  async savePushSubscription(dto: PushSubscriptionDto, userId: string, pharmacyId: string) {
    await this.prisma.pushSubscription.upsert({
      where: { endpoint: dto.endpoint },
      create: {
        endpoint: dto.endpoint,
        p256dh: dto.keys.p256dh,
        auth: dto.keys.auth,
        userAgent: dto.userAgent || null,
        userId,
        pharmacyId,
      },
      update: {
        p256dh: dto.keys.p256dh,
        auth: dto.keys.auth,
        userAgent: dto.userAgent || null,
        userId,
        pharmacyId,
      },
    });
    return { success: true, pushReady: this.isPushConfigured() };
  }

  async removePushSubscription(endpoint: string, userId: string, pharmacyId: string) {
    await this.prisma.pushSubscription.deleteMany({ where: { endpoint, userId, pharmacyId } });
    return { success: true };
  }

  async notifyManagement(args: {
    pharmacyId: string;
    type: NotificationType;
    title: string;
    message: string;
    href?: string;
    entityId?: string;
    dedupeKey?: string;
  }) {
    try {
      const managers = await this.prisma.user.findMany({
        where: { pharmacyId: args.pharmacyId, isActive: true, role: { in: ['ADMIN', 'MANAGER'] } },
        select: { id: true },
      });
      for (const manager of managers) {
        try {
          const notification = await this.prisma.notification.create({
            data: {
              pharmacyId: args.pharmacyId,
              userId: manager.id,
              type: args.type,
              title: args.title,
              message: args.message,
              href: args.href,
              entityId: args.entityId,
              dedupeKey: args.dedupeKey ? `${args.dedupeKey}:${manager.id}` : null,
            },
          });
          await this.deliverPush(manager.id, notification);
        } catch (error) {
          if ((error as { code?: string })?.code !== 'P2002') {
            this.logger.warn(`Could not create notification for manager ${manager.id}: ${String(error)}`);
          }
        }
      }
    } catch (error) {
      // Notifications must never roll back a sale, purchase, or stock change.
      this.logger.error(`Management notification failed: ${String(error)}`);
    }
  }

  async notifySaleCreated(pharmacyId: string, sale: { id: string; invoiceNumber: string; totalAmount: Prisma.Decimal; currency: string; customerName?: string | null }) {
    await this.notifyManagement({
      pharmacyId,
      type: NotificationType.SALE,
      title: 'Nouvelle vente',
      message: `${sale.invoiceNumber} · ${sale.customerName || 'Client comptoir'} · ${Number(sale.totalAmount).toLocaleString('fr-FR')} ${sale.currency}`,
      href: `/sales/${sale.id}`,
      entityId: sale.id,
    });
  }

  async notifyPurchaseReceived(pharmacyId: string, purchase: { id: string; invoiceNumber: string; supplierName: string; purchaseItems: { quantity: number }[] }) {
    const units = purchase.purchaseItems.reduce((sum, item) => sum + item.quantity, 0);
    await this.notifyManagement({
      pharmacyId,
      type: NotificationType.PURCHASE,
      title: 'Commande réceptionnée',
      message: `${purchase.invoiceNumber} · ${purchase.supplierName} · ${units} unité(s) ajoutée(s) au stock.`,
      href: `/purchases/${purchase.id}`,
      entityId: purchase.id,
    });
  }

  async notifyLowStockForMedicines(pharmacyId: string, medicineIds: string[]) {
    const medicines = await this.prisma.medicine.findMany({
      where: { id: { in: [...new Set(medicineIds)] }, pharmacyId, deletedAt: null, isActive: true },
      select: { id: true, name: true, stock: true, minStock: true },
    });
    for (const medicine of medicines.filter((item) => item.stock <= item.minStock)) {
      await this.notifyManagement({
        pharmacyId,
        type: NotificationType.LOW_STOCK,
        title: 'Stock faible',
        message: `${medicine.name} : ${medicine.stock} unité(s), seuil ${medicine.minStock}.`,
        href: '/inventory',
        entityId: medicine.id,
        dedupeKey: `low-stock:${medicine.id}:${new Date().toISOString().slice(0, 10)}`,
      });
    }
  }

  async notifyStocktakeCompleted(pharmacyId: string, stocktake: { id: string; items: { expectedQuantity: number; countedQuantity: number | null; medicine: { name: string } }[] }) {
    const differences = stocktake.items.filter((item) => item.countedQuantity !== item.expectedQuantity);
    if (differences.length === 0) return;
    const units = differences.reduce((sum, item) => sum + ((item.countedQuantity ?? 0) - item.expectedQuantity), 0);
    await this.notifyManagement({
      pharmacyId,
      type: NotificationType.STOCKTAKE,
      title: 'Inventaire validé avec écarts',
      message: `${differences.length} lot(s) ajusté(s), écart net ${units > 0 ? '+' : ''}${units} unité(s).`,
      href: '/inventory',
      entityId: stocktake.id,
    });
  }

  private async createExpiryNotifications() {
    try {
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);
      const in30Days = new Date(today);
      in30Days.setUTCDate(in30Days.getUTCDate() + 30);
      const batches = await this.prisma.medicineBatch.findMany({
        where: { quantity: { gt: 0 }, expiryDate: { lte: in30Days } },
        include: { medicine: { select: { name: true } } },
      });
      for (const batch of batches) {
        if (!batch.expiryDate) continue;
        const expired = batch.expiryDate < today;
        await this.notifyManagement({
          pharmacyId: batch.pharmacyId,
          type: NotificationType.EXPIRY,
          title: expired ? 'Lot périmé en stock' : 'Lot proche de péremption',
          message: `${batch.medicine.name} · lot ${batch.batchNumber} · ${batch.quantity} unité(s) · ${batch.expiryDate.toLocaleDateString('fr-FR')}.`,
          href: '/inventory',
          entityId: batch.id,
          dedupeKey: `expiry:${batch.id}:${batch.expiryDate.toISOString().slice(0, 10)}`,
        });
      }
    } catch (error) {
      this.logger.error(`Daily expiry notifications failed: ${String(error)}`);
    }
  }

  private isPushConfigured() {
    return !!(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
  }

  private async deliverPush(userId: string, notification: { id: string; title: string; message: string; href: string | null }) {
    if (!this.isPushConfigured()) return;
    try {
      // Loaded only when VAPID credentials are configured. In-app notifications remain available without them.
      const webPush = require('web-push');
      if (!this.webPushConfigured) {
        webPush.setVapidDetails(
          process.env.VAPID_SUBJECT || 'mailto:admin@pharmacy-erp.invalid',
          process.env.VAPID_PUBLIC_KEY,
          process.env.VAPID_PRIVATE_KEY,
        );
        this.webPushConfigured = true;
      }
      const subscriptions = await this.prisma.pushSubscription.findMany({ where: { userId } });
      const payload = JSON.stringify({
        id: notification.id,
        title: notification.title,
        body: notification.message,
        url: notification.href || '/dashboard',
      });
      await Promise.all(subscriptions.map(async (subscription) => {
        try {
          await webPush.sendNotification({ endpoint: subscription.endpoint, keys: { p256dh: subscription.p256dh, auth: subscription.auth } }, payload, { TTL: 300 });
        } catch (error) {
          const statusCode = (error as { statusCode?: number })?.statusCode;
          if (statusCode === 404 || statusCode === 410) {
            await this.prisma.pushSubscription.delete({ where: { id: subscription.id } });
          } else {
            this.logger.warn(`Push delivery failed for subscription ${subscription.id}: ${String(error)}`);
          }
        }
      }));
    } catch (error) {
      this.logger.error(`Push delivery is unavailable: ${String(error)}`);
    }
  }
}
