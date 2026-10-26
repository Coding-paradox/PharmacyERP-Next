import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Search, AlertTriangle, Package, TrendingUp } from 'lucide-react';
import { inventoryService } from '../../services/inventory.service';

export function InventoryList() {
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');

  const { data: summary, isLoading, error } = useQuery({
    queryKey: ['inventory-summary'],
    queryFn: () => inventoryService.getSummary(),
  });

  const { data: movements } = useQuery({
    queryKey: ['inventory-movements', search],
    queryFn: () => inventoryService.getMovements(search ? { medicineId: search } : {}),
  });

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
    return <div className="rounded-md bg-red-50 p-4 text-red-800">Erreur lors du chargement du stock</div>;
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const movementLabels: Record<string, string> = {
    PURCHASE: 'Achat',
    SALE: 'Vente',
    RETURN: 'Retour',
    ADJUSTMENT: 'Ajustement',
    DAMAGED: 'Abîmé',
    EXPIRED: 'Expiré',
  };

  const movementColors: Record<string, string> = {
    PURCHASE: 'text-green-600',
    SALE: 'text-blue-600',
    RETURN: 'text-purple-600',
    ADJUSTMENT: 'text-orange-600',
    DAMAGED: 'text-red-600',
    EXPIRED: 'text-gray-600',
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900">Gestion du stock</h1>

      {/* Statistiques */}
      <div className="mt-6 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">Total médicaments</p>
            <Package className="h-5 w-5 text-teal-600" />
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">{summary?.total || 0}</p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">Stock faible</p>
            <AlertTriangle className="h-5 w-5 text-yellow-600" />
          </div>
          <p className="mt-2 text-3xl font-bold text-yellow-600">{summary?.lowStock || 0}</p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">Rupture de stock</p>
            <AlertTriangle className="h-5 w-5 text-red-600" />
          </div>
          <p className="mt-2 text-3xl font-bold text-red-600">{summary?.outOfStock || 0}</p>
        </div>
        <div className="rounded-lg bg-white p-6 shadow">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-500">Mouvements</p>
            <TrendingUp className="h-5 w-5 text-teal-600" />
          </div>
          <p className="mt-2 text-3xl font-bold text-gray-900">{movements?.total || 0}</p>
        </div>
      </div>

      {/* Liste des médicaments avec stock */}
      <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
        <div className="border-b p-4">
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un médicament..."
                className="w-full rounded-md border border-gray-300 pl-10 pr-4 py-2 focus:border-teal-600 focus:outline-none focus:ring-teal-600"
              />
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="rounded-md border border-gray-300 px-4 py-2 focus:border-teal-600 focus:outline-none focus:ring-teal-600"
            >
              <option value="all">Tous</option>
              <option value="low">Stock faible</option>
              <option value="out">Rupture</option>
              <option value="normal">Normal</option>
            </select>
          </div>
        </div>

        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Code</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Médicament</th>
              <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Stock</th>
              <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Seuil min.</th>
              <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {summary?.medicines?.filter((m: any) => {
              if (filter === 'low') return m.stock > 0 && m.stock <= m.minStock;
              if (filter === 'out') return m.stock === 0;
              if (filter === 'normal') return m.stock > m.minStock;
              return true;
            }).length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-4 text-center text-sm text-gray-500">
                  Aucun médicament trouvé
                </td>
              </tr>
            ) : (
              summary?.medicines?.filter((m: any) => {
                if (filter === 'low') return m.stock > 0 && m.stock <= m.minStock;
                if (filter === 'out') return m.stock === 0;
                if (filter === 'normal') return m.stock > m.minStock;
                return true;
              }).map((medicine: any) => {
                const status = medicine.stock === 0 ? 'Rupture' :
                              medicine.stock <= medicine.minStock ? 'Stock faible' : 'Normal';
                const statusColor = medicine.stock === 0 ? 'text-red-600' :
                                   medicine.stock <= medicine.minStock ? 'text-yellow-600' : 'text-green-600';

                return (
                  <tr key={medicine.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 text-sm font-medium text-gray-900">{medicine.code}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{medicine.name}</td>
                    <td className="px-6 py-4 text-center text-sm font-medium text-gray-900">{medicine.stock}</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-600">{medicine.minStock}</td>
                    <td className="px-6 py-4 text-center text-sm font-medium">
                      <span className={statusColor}>{status}</span>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Derniers mouvements */}
      <div className="mt-6 overflow-hidden rounded-lg border border-gray-200 bg-white shadow">
        <div className="border-b p-4">
          <h2 className="text-lg font-semibold text-gray-900">Derniers mouvements</h2>
        </div>
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Médicament</th>
              <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Qté</th>
              <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Type</th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {movements?.data?.slice(0, 10).length === 0 ? (
              <tr>
                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                  Aucun mouvement
                </td>
              </tr>
            ) : (
              movements?.data?.slice(0, 10).map((movement: any) => (
                <tr key={movement.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{movement.medicine?.name || '-'}</td>
                  <td className="px-6 py-4 text-center text-sm font-medium text-gray-900">
                    {movement.quantity > 0 ? '+' : ''}{movement.quantity}
                  </td>
                  <td className="px-6 py-4 text-center text-sm">
                    <span className={movementColors[movement.movementType] || 'text-gray-600'}>
                      {movementLabels[movement.movementType] || movement.movementType}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">{formatDate(movement.createdAt)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}