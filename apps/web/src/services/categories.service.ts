import { api } from './api';

export interface Category {
  id: string;
  name: string;
  description?: string;
  pharmacyId: string;
  createdAt: string;
  updatedAt: string;
  _count?: {
    medicines: number;
  };
}

class CategoriesService {
  async findAll(search?: string): Promise<Category[]> {
    const response = await api.get('/categories', { params: { search } });
    return response.data;
  }

  async findOne(id: string): Promise<Category> {
    const response = await api.get(`/categories/${id}`);
    return response.data;
  }

  async create(data: { name: string; description?: string; pharmacyId: string }): Promise<Category> {
    const response = await api.post('/categories', data);
    return response.data;
  }

  async update(id: string, data: { name?: string; description?: string }): Promise<Category> {
    const response = await api.patch(`/categories/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/categories/${id}`);
  }
}

export const categoriesService = new CategoriesService();