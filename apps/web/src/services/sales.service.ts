import { api } from './api';
import type { Currency } from './medicines.service';

export interface Sale {
  id: string;
  invoiceNumber: string;
  customerName?: string;
  customerPhone?: string;
  totalAmount: number;
  discount: number;
  tax: number;
  netAmount: number;
  currency: Currency;
  paymentMethod: string;
  status: string;
  notes?: string;
  pharmacyId: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  saleItems: SaleItem[];
}

export interface SaleItem {
  id: string;
  saleId: string;
  medicineId: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  currency: Currency;
  discount: number;
  medicine: {
    id: string;
    name: string;
    code: string;
  };
}

class SalesService {
  async findAll(params?: { search?: string; status?: string }): Promise<Sale[]> {
    const response = await api.get('/sales', { params });
    return response.data;
  }

  async findOne(id: string): Promise<Sale> {
    const response = await api.get(`/sales/${id}`);
    return response.data;
  }

  async create(data: any): Promise<Sale> {
    const response = await api.post('/sales', data);
    return response.data;
  }

  async update(id: string, data: any): Promise<Sale> {
    const response = await api.patch(`/sales/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/sales/${id}`);
  }

  async cancel(id: string): Promise<void> {
    await api.post(`/sales/${id}/cancel`);
  }
}

export const salesService = new SalesService();
