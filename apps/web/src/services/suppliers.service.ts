import { api } from './api';

export interface Supplier {
  id: string;
  name: string;
  description?: string;
  email?: string;
  phone?: string;
  address?: string;
  pharmacyId: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    purchases: number;
  };
}

class SuppliersService {
  async findAll(search?: string): Promise<Supplier[]> {
    const response = await api.get('/suppliers', { params: { search } });
    return response.data;
  }

  async findOne(id: string): Promise<Supplier> {
    const response = await api.get(`/suppliers/${id}`);
    return response.data;
  }

  async create(data: {
    name: string;
    description?: string;
    email?: string;
    phone?: string;
    address?: string;
    pharmacyId: string;
  }): Promise<Supplier> {
    const response = await api.post('/suppliers', data);
    return response.data;
  }

  async update(
    id: string,
    data: {
      name?: string;
      description?: string;
      email?: string;
      phone?: string;
      address?: string;
    },
  ): Promise<Supplier> {
    const response = await api.patch(`/suppliers/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/suppliers/${id}`);
  }
}

export const suppliersService = new SuppliersService();