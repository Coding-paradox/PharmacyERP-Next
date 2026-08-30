import { api } from './api';

export interface PharmacySettings {
  id: string;
  name: string;
  address?: string;
  phone?: string;
  email?: string;
  taxId?: string;
  logo?: string;
  timezone: string;
  currency: string;
  isActive: boolean;
  tenantId: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    users: number;
    medicines: number;
    sales: number;
    purchases: number;
  };
}

export interface SystemInfo {
  users: number;
  medicines: number;
  sales: number;
  purchases: number;
  customers: number;
  suppliers: number;
}

class SettingsService {
  async getPharmacySettings(): Promise<PharmacySettings> {
    const response = await api.get('/settings/pharmacy');
    return response.data;
  }

  async updatePharmacySettings(data: Partial<PharmacySettings>): Promise<PharmacySettings> {
    const response = await api.patch('/settings/pharmacy', data);
    return response.data;
  }

  async getSystemInfo(): Promise<SystemInfo> {
    const response = await api.get('/settings/system-info');
    return response.data;
  }
}

export const settingsService = new SettingsService();