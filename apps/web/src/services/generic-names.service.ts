import { api } from './api';

export interface GenericName {
  id: string;
  name: string;
  description?: string;
  pharmacyId: string;
}

class GenericNamesService {
  async findAll(): Promise<GenericName[]> {
    const response = await api.get('/generic-names');
    return response.data;
  }
}

export const genericNamesService = new GenericNamesService();