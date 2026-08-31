import { api } from './api';

export interface Manufacturer {
  id: string;
  name: string;
  country?: string;
  email?: string;
  phone?: string;
  pharmacyId: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    medicines: number;
  };
}

class ManufacturersService {
  async findAll(search?: string): Promise<Manufacturer[]> {
    const response = await api.get('/manufacturers', { params: { search } });
    return response.data;
  }

  async findOne(id: string): Promise<Manufacturer> {
    const response = await api.get(`/manufacturers/${id}`);
    return response.data;
  }

  async create(data: {
    name: string;
    country?: string;
    email?: string;
    phone?: string;
    pharmacyId: string;
  }): Promise<Manufacturer> {
    const response = await api.post('/manufacturers', data);
    return response.data;
  }

  async update(
    id: string,
    data: {
      name?: string;
      country?: string;
      email?: string;
      phone?: string;
    },
  ): Promise<Manufacturer> {
    const response = await api.patch(`/manufacturers/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    try {
      await api.delete(`/manufacturers/${id}`);
    } catch (error: any) {
      console.error('[ManufacturersService.delete] Error:', error);
      throw error;
    }
  }
}

export const manufacturersService = new ManufacturersService();