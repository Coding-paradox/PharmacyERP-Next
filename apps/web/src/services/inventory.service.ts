import { api } from './api';

class InventoryService {
  async getSummary() {
    const response = await api.get('/inventory/summary');
    return response.data;
  }

  async getMovements(params?: { medicineId?: string; limit?: number; offset?: number }) {
    const response = await api.get('/inventory/movements', { params });
    return response.data;
  }

  async adjustStock(data: { medicineId: string; quantity: number; movementType: string; notes?: string }) {
    const response = await api.post('/inventory/adjust', data);
    return response.data;
  }

  async getAlerts() {
    const response = await api.get('/inventory/alerts');
    return response.data;
  }
}

export const inventoryService = new InventoryService();