import { api } from './api';

export interface Unit {
  id: string;
  name: string;
  symbol?: string;
  pharmacyId: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    medicines: number;
  };
}

class UnitsService {
  async findAll(search?: string): Promise<Unit[]> {
    const response = await api.get('/units', { params: { search } });
    return response.data;
  }

  async findOne(id: string): Promise<Unit> {
    const response = await api.get(`/units/${id}`);
    return response.data;
  }

  async create(data: { name: string; symbol?: string; pharmacyId: string }): Promise<Unit> {
    const response = await api.post('/units', data);
    return response.data;
  }

  async update(id: string, data: { name?: string; symbol?: string }): Promise<Unit> {
    const response = await api.patch(`/units/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/units/${id}`);
  }
}

export const unitsService = new UnitsService();