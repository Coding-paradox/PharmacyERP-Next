import { api } from './api';

export interface Dosage {
  id: string;
  name: string;
  description?: string;
  pharmacyId: string;
}

class DosagesService {
  async findAll(): Promise<Dosage[]> {
    const response = await api.get('/dosages');
    return response.data;
  }
}

export const dosagesService = new DosagesService();