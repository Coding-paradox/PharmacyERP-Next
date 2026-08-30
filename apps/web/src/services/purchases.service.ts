import { api } from './api';
import type { Currency } from './medicines.service';

export interface PurchaseItem {
  id: string;
  medicineId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currency: Currency;
  expiryDate?: string;
  batchNumber?: string;
  medicine?: {
    id: string;
    name: string;
    code: string;
  };
}

export interface Purchase {
  id: string;
  invoiceNumber: string;
  supplierId?: string;
  supplierName: string;
  supplierPhone?: string;
  totalAmount: number;
  tax: number;
  netAmount: number;
  currency: Currency;
  status: 'PENDING' | 'PAID' | 'CANCELLED' | 'REFUNDED';
  notes?: string;
  pharmacyId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  purchaseItems: PurchaseItem[];
  supplier?: {
    id: string;
    name: string;
  };
  user?: {
    id: string;
    firstName: string;
    lastName: string;
  };
}

class PurchasesService {
  async findAll(params?: { status?: string; search?: string }): Promise<Purchase[]> {
    const response = await api.get('/purchases', { params });
    return response.data;
  }

  async findOne(id: string): Promise<Purchase> {
    const response = await api.get(`/purchases/${id}`);
    return response.data;
  }

  async create(data: any): Promise<Purchase> {
    const response = await api.post('/purchases', data);
    return response.data;
  }

  async update(id: string, data: { status?: string; notes?: string }): Promise<Purchase> {
    const response = await api.patch(`/purchases/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/purchases/${id}`);
  }

  async receive(id: string): Promise<Purchase> {
    const response = await api.post(`/purchases/${id}/receive`);
    return response.data;
  }
}

export const purchasesService = new PurchasesService();
