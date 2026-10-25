import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, Ruler, Info } from 'lucide-react';
import { unitsService, type Unit } from '../../services/units.service';

export function UnitsList() {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: units, isLoading, error } = useQuery({
    queryKey: ['units', search],
    queryFn: () => unitsService.findAll(search),
  });

  const deleteMutation = useMutation({
    mutationFn: unitsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['units'] });
    },
    onError: (err: any) => {
      const message = err.response?.data?.message || 'Erreur lors de la suppression';
      alert(message);
    },
  });

  const handleDelete = async (unit: Unit) => {
    const medicineCount = unit._count?.medicines || 0;

    if (medicineCount > 0) {
      alert(
        `Impossible de supprimer "${unit.name}" : ${medicineCount} médicament(s) y sont encore rattaché(s).\n\nRéassignez-les d'abord à une autre unité avant de supprimer celle-ci.`,
      );
      return;
    }

    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'unité "${unit.name}" ?`)) {
      try {
        await deleteMutation.mutateAsync(unit.id);
      } catch (err: any) {
        // Erreur déjà affichée via onError ci-dessus.
      }
    }
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
        Erreur lors du chargement des unités
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Unités de mesure</h1>
        <Link
          to="/units/new"
          className="inline-flex items-center gap-2 rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nouvelle unité
        </Link>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher une unité..."
            className="w-full rounded-md border border-gray-300 pl-10 pr-4 py-2 focus:border-teal-600 focus:outline-none focus:ring-teal-600"
          />
        </div>
      </div>

      <div className="mt-6 flex-1 overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Nom
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Symbole
                </th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">
                  Médicaments
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {units?.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-sm text-gray-500">
                    <div className="flex flex-col items-center gap-2">
                      <Ruler className="h-8 w-8 text-gray-300" />
                      <p>Aucune unité trouvée</p>
                      <Link
                        to="/units/new"
                        className="text-teal-600 hover:text-teal-800 font-medium"
                      >
                        Créer une unité
                      </Link>
                    </div>
                  </td>
                </tr>
              ) : (
                units?.map((unit) => {
                  const medicineCount = unit._count?.medicines || 0;
                  const isUsed = medicineCount > 0;

                  return (
                    <tr key={unit.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 text-sm font-medium text-gray-900">
                        <div className="flex items-center gap-2">
                          <Ruler className="h-4 w-4 text-teal-600" />
                          {unit.name}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {unit.symbol || '-'}
                      </td>
                      <td className="px-6 py-4 text-center text-sm">
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                            isUsed
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-600'
                          }`}
                        >
                          {medicineCount}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right text-sm">
                        <div className="flex items-center justify-end gap-2">
                          <Link
                            to={`/units/${unit.id}/edit`}
                            className="rounded p-1 text-teal-600 hover:bg-teal-50 hover:text-teal-800 transition-colors"
                            title="Modifier"
                          >
                            <Edit className="h-4 w-4" />
                          </Link>
                          <div className="relative group">
                            <button
                              onClick={() => handleDelete(unit)}
                              className={`rounded p-1 transition-colors ${
                                isUsed
                                  ? 'text-gray-300 cursor-not-allowed'
                                  : 'text-red-400 hover:bg-red-50 hover:text-red-600'
                              }`}
                              disabled={isUsed}
                              title={
                                isUsed
                                  ? `Utilisée par ${medicineCount} médicament(s)`
                                  : 'Supprimer'
                              }
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                            {isUsed && (
                              <div className="absolute bottom-full right-0 mb-2 hidden w-56 rounded-md bg-gray-900 p-2 text-xs text-white shadow-lg group-hover:block">
                                <div className="flex items-start gap-2">
                                  <Info className="h-3 w-3 shrink-0 mt-0.5" />
                                  <span>
                                    Utilisée par {medicineCount} médicament(s).
                                    Supprimez ou réassignez-les d'abord.
                                  </span>
                                </div>
                                <div className="absolute -bottom-1 right-3 h-2 w-2 rotate-45 bg-gray-900"></div>
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}