import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react';
import { Currency, medicinesService } from '../../services/medicines.service';

export function MedicinesList() {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading, error } = useQuery({
    queryKey: ['medicines', search],
    queryFn: () => medicinesService.findAll({ search }),
  });

  const deleteMutation = useMutation({
    mutationFn: medicinesService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['medicines'] });
    },
  });

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce médicament ?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (err: any) {
        alert(err.response?.data?.message || 'Erreur lors de la suppression');
      }
    }
  };

  // Fonction pour formater les nombres
  const formatPrice = (value: any, currency: Currency = 'CDF'): string => {
    if (value === null || value === undefined) return '-';
    const num = typeof value === 'number' ? value : Number(value);
    return isNaN(num) ? '-' : `${num.toFixed(2)} ${currency}`;
  };

  const formatNumber = (value: any): string => {
    if (value === null || value === undefined) return '0';
    const num = typeof value === 'number' ? value : Number(value);
    return isNaN(num) ? '0' : num.toString();
  };

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-700 border-t-transparent"></div>
          <p className="mt-2 text-sm text-gray-500">Chargement...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 text-red-800">
        Erreur lors du chargement des médicaments
      </div>
    );
  }

  const medicines = data?.data || [];

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Médicaments</h1>
        <Link
          to="/medicines/new"
          className="inline-flex items-center gap-2 rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
        >
          <Plus className="h-4 w-4" />
          Nouveau médicament
        </Link>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un médicament..."
            className="w-full rounded-md border border-gray-300 pl-10 pr-4 py-2 focus:border-teal-600 focus:outline-none focus:ring-teal-600"
          />
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Code
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Nom
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Prix d'achat
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Prix de vente
              </th>
              <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                Stock
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {medicines.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-sm text-gray-500">
                  Aucun médicament trouvé
                </td>
              </tr>
            ) : (
              medicines.map((medicine: any) => (
                <tr key={medicine.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {medicine.code}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {medicine.name}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-600">
                    {formatPrice(medicine.costPrice, medicine.costCurrency)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm text-gray-600">
                    {formatPrice(medicine.sellingPrice, medicine.sellingCurrency)}
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">
                    {formatNumber(medicine.stock)}
                  </td>
                  <td className="px-6 py-4 text-right text-sm">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/medicines/${medicine.id}`}
                        className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      <Link
                        to={`/medicines/${medicine.id}/edit`}
                        className="rounded p-1 text-teal-600 hover:bg-teal-50 hover:text-teal-800"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(medicine.id)}
                        className="rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
