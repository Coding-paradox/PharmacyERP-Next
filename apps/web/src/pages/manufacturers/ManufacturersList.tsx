import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Edit, Trash2, Building2, Mail, Phone, MapPin } from 'lucide-react';
import { manufacturersService, type Manufacturer } from '../../services/manufacturers.service';

export function ManufacturersList() {
  const [search, setSearch] = useState('');
  const queryClient = useQueryClient();

  const { data: manufacturers, isLoading, error } = useQuery({
    queryKey: ['manufacturers', search],
    queryFn: () => manufacturersService.findAll(search),
  });

  const deleteMutation = useMutation({
    mutationFn: manufacturersService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['manufacturers'] });
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Erreur lors de la suppression');
    },
  });

  const handleDelete = async (manufacturer: Manufacturer) => {
    const medicineCount = manufacturer._count?.medicines || 0;

    // Le bouton reste TOUJOURS cliquable — au lieu de le désactiver
    // silencieusement (ancien comportement : `disabled={...}` sans aucun
    // changement visuel, donc l'utilisateur ne comprenait pas pourquoi
    // rien ne se passait), on explique clairement pourquoi la suppression
    // est bloquée.
    if (medicineCount > 0) {
      alert(
        `Impossible de supprimer "${manufacturer.name}" : ${medicineCount} médicament(s) y sont encore rattaché(s). Réassignez-les d'abord à un autre fabricant avant de supprimer celui-ci.`,
      );
      return;
    }

    if (confirm(`Êtes-vous sûr de vouloir supprimer le fabricant "${manufacturer.name}" ?`)) {
      try {
        await deleteMutation.mutateAsync(manufacturer.id);
      } catch (err: any) {
        // Erreur déjà affichée via onError ci-dessus ; ce catch empêche
        // seulement une promesse rejetée non gérée.
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
        Erreur lors du chargement des fabricants
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Fabricants / Laboratoires</h1>
        <Link
          to="/manufacturers/new"
          className="inline-flex items-center gap-2 rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
        >
          <Plus className="h-4 w-4" />
          Nouveau fabricant
        </Link>
      </div>

      <div className="mt-4 flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un fabricant..."
            className="w-full rounded-md border border-gray-300 pl-10 pr-4 py-2 focus:border-teal-600 focus:outline-none focus:ring-teal-600"
          />
        </div>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Nom
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Pays
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Contact
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
            {manufacturers?.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                  Aucun fabricant trouvé
                </td>
              </tr>
            ) : (
              manufacturers?.map((m) => {
                const medicineCount = m._count?.medicines || 0;
                return (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-teal-600" />
                        {m.name}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3 w-3 text-gray-400" />
                        {m.country || '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-600">
                      <div className="flex flex-col gap-1">
                        {m.email && (
                          <div className="flex items-center gap-1 text-xs">
                            <Mail className="h-3 w-3 text-gray-400" />
                            {m.email}
                          </div>
                        )}
                        {m.phone && (
                          <div className="flex items-center gap-1 text-xs">
                            <Phone className="h-3 w-3 text-gray-400" />
                            {m.phone}
                          </div>
                        )}
                        {!m.email && !m.phone && '-'}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">
                      {medicineCount}
                    </td>
                    <td className="px-6 py-4 text-right text-sm">
                      <div className="flex justify-end gap-2">
                        <Link
                          to={`/manufacturers/${m.id}/edit`}
                          className="rounded p-1 text-teal-600 hover:bg-teal-50 hover:text-teal-800"
                        >
                          <Edit className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(m)}
                          className={
                            medicineCount > 0
                              ? 'rounded p-1 text-gray-300 hover:bg-gray-50 hover:text-gray-400'
                              : 'rounded p-1 text-red-400 hover:bg-red-50 hover:text-red-600'
                          }
                          title={
                            medicineCount > 0
                              ? `Utilisé par ${medicineCount} médicament(s) — cliquez pour voir le détail`
                              : 'Supprimer'
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
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
  );
}