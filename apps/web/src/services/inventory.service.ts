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

  async getExpiryAlerts(days = 90) {
    const response = await api.get('/inventory/expiry-alerts', { params: { days } });
    return response.data;
  }

  async listStocktakes() {
    const response = await api.get('/inventory/stocktakes');
    return response.data;
  }

  async createStocktake() {
    const response = await api.post('/inventory/stocktakes');
    return response.data;
  }

  async getStocktake(id: string) {
    const response = await api.get(`/inventory/stocktakes/${id}`);
    return response.data;
  }

  async completeStocktake(id: string, items: { itemId: string; countedQuantity: number; batchNumber?: string; expiryDate?: string }[]) {
    const response = await api.post(`/inventory/stocktakes/${id}/complete`, { items });
    return response.data;
  }

  async cancelStocktake(id: string) {
    const response = await api.post(`/inventory/stocktakes/${id}/cancel`);
    return response.data;
  }
}

export const inventoryService = new InventoryService();
