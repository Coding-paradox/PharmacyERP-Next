import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Eye, Trash2, Package, Truck } from 'lucide-react';
import { purchasesService } from '../../services/purchases.service';

const statusConfig = {
  PENDING: { label: 'En attente', className: 'bg-yellow-100 text-yellow-700' },
  PAID: { label: 'Réceptionné', className: 'bg-green-100 text-green-700' },
  CANCELLED: { label: 'Annulé', className: 'bg-red-100 text-red-700' },
  REFUNDED: { label: 'Remboursé', className: 'bg-gray-100 text-gray-700' },
};

function PurchaseStatusBadge({ status }: { status: keyof typeof statusConfig }) {
  const config = statusConfig[status] || statusConfig.PENDING;
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}

export function PurchasesList() {
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const queryClient = useQueryClient();

  const { data: purchases, isLoading, error } = useQuery({
    queryKey: ['purchases', search, status],
    queryFn: () => purchasesService.findAll({ search, status }),
  });

  const deleteMutation = useMutation({
    mutationFn: purchasesService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
    },
  });

  const handleDelete = async (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet achat ?')) {
      try {
        await deleteMutation.mutateAsync(id);
      } catch (err: any) {
        alert(err.response?.data?.message || 'Erreur lors de la suppression');
      }
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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
    return <div className="rounded-lg bg-red-50 p-4 text-red-800">Erreur lors du chargement des achats</div>;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Achats</h1>
          <p className="text-sm text-gray-500">Gestion des commandes d'achat</p>
        </div>
        <Link
          to="/purchases/new"
          className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nouvel achat
        </Link>
      </div>

      <div className="flex flex-wrap items-center gap-4 mb-6">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un achat..."
            className="w-full rounded-lg border border-gray-300 pl-10 pr-4 py-2 focus:border-teal-500 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-lg border border-gray-300 px-4 py-2 focus:border-teal-500 focus:ring-2 focus:ring-teal-500 focus:outline-none transition-all"
        >
          <option value="">Tous les statuts</option>
          <option value="PENDING">En attente</option>
          <option value="PAID">Réceptionné</option>
          <option value="CANCELLED">Annulé</option>
          <option value="REFUNDED">Remboursé</option>
        </select>
      </div>

      <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
        {purchases?.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <Package className="h-12 w-12 text-gray-300" />
            <p className="mt-3 text-sm text-gray-500">Aucun achat enregistré</p>
            <Link to="/purchases/new" className="mt-2 text-sm text-teal-600 hover:underline">
              Créer votre premier achat
            </Link>
          </div>
        ) : (
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">N° Commande</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Fournisseur</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Total</th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Articles</th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Statut</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {purchases?.map((purchase) => (
                <tr key={purchase.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm font-medium text-gray-900">
                    {purchase.invoiceNumber}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-gray-400" />
                      {purchase.supplierName}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">
                    {purchase.totalAmount?.toFixed(2)} {purchase.currency || 'CDF'}
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">
                    {purchase.purchaseItems?.length || 0}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <PurchaseStatusBadge status={purchase.status} />
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">
                    {formatDate(purchase.createdAt)}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to={`/purchases/${purchase.id}`}
                        className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      {purchase.status === 'PENDING' && (
                        <button
                          onClick={() => handleDelete(purchase.id)}
                          className="rounded-lg p-2 text-gray-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
