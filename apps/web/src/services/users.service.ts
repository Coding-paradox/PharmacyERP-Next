import { api } from './api';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  isActive: boolean;
  pharmacyId: string;
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
  _count?: {
    sales: number;
    purchases: number;
  };
}

class UsersService {
  async findAll(search?: string): Promise<User[]> {
    const response = await api.get('/users', { params: { search } });
    return response.data;
  }

  async findOne(id: string): Promise<User> {
    const response = await api.get(`/users/${id}`);
    return response.data;
  }

  async create(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role?: string;
    isActive?: boolean;
    pharmacyId: string;
  }): Promise<User> {
    const response = await api.post('/users', data);
    return response.data;
  }

  async update(
    id: string,
    data: {
      email?: string;
      password?: string;
      firstName?: string;
      lastName?: string;
      phone?: string;
      role?: string;
      isActive?: boolean;
    },
  ): Promise<User> {
    const response = await api.patch(`/users/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/users/${id}`);
  }
}

export const usersService = new UsersService();