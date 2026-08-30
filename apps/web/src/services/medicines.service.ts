import { api } from './api';

export type Currency = 'CDF' | 'USD';

export interface Medicine {
  id: string;
  code: string;
  barcode?: string;
  name: string;
  genericNameId?: string;
  dosageId?: string;
  dosageFormId?: string;
  genericName?: { id: string; name: string } | string | null;
  dosage?: { id: string; name: string } | string | null;
  dosageForm?: { id: string; name: string } | string | null;
  categoryId?: string;
  manufacturerId?: string;
  unitId?: string;
  costPrice?: number;
  costCurrency: Currency;
  sellingPrice?: number;
  sellingCurrency: Currency;
  stock?: number;
  minStock?: number;
  isActive: boolean;
  pharmacyId: string;
  createdAt: string;
  updatedAt: string;
}

export interface MedicinesQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface MedicinesResponse {
  data: Medicine[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

class MedicinesService {
  async findAll(params: MedicinesQueryParams = {}): Promise<MedicinesResponse> {
    const response = await api.get('/medicines', { params });
    return response.data;
  }

  async findOne(id: string): Promise<Medicine> {
    const response = await api.get(`/medicines/${id}`);
    return response.data.data;
  }

  async create(data: Partial<Medicine>): Promise<Medicine> {
    const response = await api.post('/medicines', data);
    return response.data.data;
  }

  async update(id: string, data: Partial<Medicine>): Promise<Medicine> {
    const response = await api.patch(`/medicines/${id}`, data);
    return response.data.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/medicines/${id}`);
  }

  async findByBarcode(barcode: string): Promise<Medicine> {
    const response = await api.get(`/medicines/barcode/${barcode}`);
    return response.data.data;
  }
}

export const medicinesService = new MedicinesService();
