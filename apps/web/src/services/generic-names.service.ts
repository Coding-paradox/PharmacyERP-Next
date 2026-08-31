import { api } from './api';

export interface GenericName {
  id: string;
  name: string;
  description?: string;
  pharmacyId: string;
}

class GenericNamesService {
  async findAll(search?: string): Promise<GenericName[]> {
    const response = await api.get('/generic-names', { params: { search } });
    return response.data;
  }

  // Les méthodes ci-dessous manquaient entièrement — le service ne
  // contenait que findAll(). GenericNameForm.tsx et GenericNamesList.tsx
  // appelaient déjà create/findOne/update/delete, mais comme Vite ne
  // bloque pas la compilation en dev sur une méthode manquante, l'erreur
  // n'apparaissait qu'au clic, en silence ("X is not a function").

  async findOne(id: string): Promise<GenericName> {
    const response = await api.get(`/generic-names/${id}`);
    return response.data;
  }

  async create(data: { name: string; description?: string; pharmacyId: string }): Promise<GenericName> {
    const response = await api.post('/generic-names', data);
    return response.data;
  }

  async update(id: string, data: { name?: string; description?: string }): Promise<GenericName> {
    const response = await api.patch(`/generic-names/${id}`, data);
    return response.data;
  }

  async delete(id: string): Promise<void> {
    await api.delete(`/generic-names/${id}`);
  }
}

export const genericNamesService = new GenericNamesService();