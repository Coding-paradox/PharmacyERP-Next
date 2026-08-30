import { api } from './api';

export interface DosageForm {
  id: string;
  name: string;
  description?: string;
  pharmacyId: string;
}

class DosageFormsService {
  async findAll(): Promise<DosageForm[]> {
    const response = await api.get('/dosage-forms');
    return response.data;
  }
}

export const dosageFormsService = new DosageFormsService();