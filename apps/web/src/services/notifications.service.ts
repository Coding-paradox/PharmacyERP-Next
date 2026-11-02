import { api } from './api';

export interface AppNotification {
  id: string;
  type: 'SALE' | 'PURCHASE' | 'LOW_STOCK' | 'EXPIRY' | 'STOCKTAKE';
  title: string;
  message: string;
  href?: string | null;
  readAt?: string | null;
  createdAt: string;
}

class NotificationsService {
  async list(): Promise<{ items: AppNotification[]; unreadCount: number }> {
    const response = await api.get('/notifications');
    return response.data;
  }

  async markRead(id: string) {
    const response = await api.patch(`/notifications/${id}/read`);
    return response.data;
  }

  async markAllRead() {
    const response = await api.post('/notifications/read-all');
    return response.data;
  }

  async pushConfig(): Promise<{ publicKey: string | null }> {
    const response = await api.get('/notifications/push/config');
    return response.data;
  }

  async subscribe(subscription: PushSubscription) {
    const response = await api.post('/notifications/push/subscriptions', {
      ...subscription.toJSON(),
      userAgent: navigator.userAgent,
    });
    return response.data;
  }

  async unsubscribe(endpoint: string) {
    const response = await api.delete('/notifications/push/subscriptions', { data: { endpoint } });
    return response.data;
  }
}

export const notificationsService = new NotificationsService();
