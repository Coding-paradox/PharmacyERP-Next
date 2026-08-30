import { api } from './api';

export interface Customer {
  id: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  currency: string;
  pharmacyId: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    sales: number;
  };
}

class CustomersService {
  async findAll(search?: string): Promise<Customer[]> {
    const response = await api.get('/customers', { params: { search } });
    return response.data;
  }

  async findOne(id: string): Promise<Customer> {
    const response = await api.get(`/customers/${id}`);
    return response.data;
  }

  async create(data: {
    name: string;
    phone?: string;
    email?: string;
    address?: string;
    currency?: string;
    pharmacyId: string;
  }): Promise<Customer> {
    const response = await api.post('/customers', data);
    return response.data;
  }

  async update(
    id: string,
    data: {
      name?: string;
      phone?: string;
      email?: string;
      address?: string;
      currency?: string;
    },
  ): Promise<Customer> {
    const response = await api.patch(`/customers/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/customers/${id}`);
  }
}

export const customersService = new CustomersService();