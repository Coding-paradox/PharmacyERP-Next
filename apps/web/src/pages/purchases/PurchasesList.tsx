import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Search, Eye, Trash2, Package, Truck, Clock3, CircleCheck, ClipboardList, ArrowUpRight } from 'lucide-react';
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
  const { data: allPurchases = [] } = useQuery({
    queryKey: ['purchases-summary'],
    queryFn: () => purchasesService.findAll(),
  });

  const metrics = useMemo(() => ({
    total: allPurchases.length,
    pending: allPurchases.filter((purchase) => purchase.status === 'PENDING').length,
    received: allPurchases.filter((purchase) => purchase.status === 'PAID').length,
    units: allPurchases.reduce((sum, purchase) => sum + (purchase.purchaseItems ?? []).reduce((lineSum, item) => lineSum + item.quantity, 0), 0),
  }), [allPurchases]);

  const deleteMutation = useMutation({
    mutationFn: purchasesService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['purchases-summary'] });
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
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Approvisionnement</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-950">Achats</h1>
          <p className="mt-1 text-sm text-gray-500">Commandes fournisseur, réceptions et lots associés.</p>
        </div>
        <Link
          to="/purchases/new"
          className="inline-flex items-center gap-2 rounded-xl bg-teal-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:bg-teal-900"
        >
          <Plus className="h-4 w-4" />
          Nouvel achat
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Commandes au total', value: metrics.total, icon: ClipboardList, tone: 'teal' },
          { label: 'À réceptionner', value: metrics.pending, icon: Clock3, tone: 'amber' },
          { label: 'Réceptionnées', value: metrics.received, icon: CircleCheck, tone: 'emerald' },
          { label: 'Unités commandées', value: metrics.units, icon: Package, tone: 'blue' },
        ].map(({ label, value, icon: Icon, tone }) => <div key={label} className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between"><p className="text-sm font-medium text-gray-500">{label}</p><span className={`rounded-xl p-2.5 ${tone === 'amber' ? 'bg-amber-50 text-amber-700' : tone === 'emerald' ? 'bg-emerald-50 text-emerald-700' : tone === 'blue' ? 'bg-blue-50 text-blue-700' : 'bg-teal-50 text-teal-800'}`}><Icon className="h-4 w-4" /></span></div>
          <p className="mt-3 text-3xl font-bold tracking-tight text-gray-950">{value.toLocaleString('fr-FR')}</p>
        </div>)}
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-white p-3 shadow-sm">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un achat..."
            className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm transition focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-50"
          />
        </div>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="rounded-xl border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm transition focus:border-teal-600 focus:bg-white focus:outline-none focus:ring-4 focus:ring-teal-50"
        >
          <option value="">Tous les statuts</option>
          <option value="PENDING">En attente</option>
          <option value="PAID">Réceptionné</option>
          <option value="CANCELLED">Annulé</option>
          <option value="REFUNDED">Remboursé</option>
        </select>
      </div>

      {deleteMutation.isError && <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">La commande n’a pas pu être supprimée. Vérifiez son statut puis réessayez.</p>}

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        {purchases?.length === 0 ? (
            <div className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <span className="rounded-2xl bg-teal-50 p-4 text-teal-800"><Package className="h-7 w-7" /></span>
            <p className="mt-4 font-semibold text-gray-900">Aucune commande trouvée</p>
            <p className="mt-1 max-w-sm text-sm text-gray-500">Aucune commande fournisseur enregistrée.</p>
            <Link to="/purchases/new" className="mt-4 inline-flex items-center gap-2 rounded-xl bg-teal-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-900">
              <Plus className="h-4 w-4" /> Créer un achat
            </Link>
          </div>
        ) : (
          <>
          <div className="hidden overflow-x-auto md:block"><table className="min-w-full divide-y divide-gray-200">
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
                    <div>{purchase.invoiceNumber}</div>
                    {purchase.supplierInvoiceNumber && <div className="mt-1 text-xs font-normal text-gray-500">Facture : {purchase.supplierInvoiceNumber}</div>}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Truck className="h-4 w-4 text-gray-400" />
                      {purchase.supplierName}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                    {Number(purchase.totalAmount || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {purchase.currency || 'CDF'}
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
                        aria-label="Voir la commande"
                        className="rounded-lg p-2 text-gray-400 transition hover:bg-teal-50 hover:text-teal-800"
                      >
                        <Eye className="h-4 w-4" />
                      </Link>
                      {purchase.status === 'PENDING' && (
                        <button
                          onClick={() => handleDelete(purchase.id)}
                          aria-label="Supprimer la commande en attente"
                          className="rounded-lg p-2 text-gray-400 transition hover:bg-red-50 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
          <div className="divide-y divide-gray-100 md:hidden">{purchases?.map((purchase) => <Link key={purchase.id} to={`/purchases/${purchase.id}`} className="block p-4 transition hover:bg-gray-50">
            <div className="flex items-start justify-between gap-3"><div className="min-w-0"><p className="truncate font-semibold text-gray-900">{purchase.supplierName}</p><p className="mt-0.5 text-xs text-gray-500">{purchase.invoiceNumber} · {formatDate(purchase.createdAt)}</p>{purchase.supplierInvoiceNumber && <p className="mt-1 text-xs text-gray-500">Facture : {purchase.supplierInvoiceNumber}</p>}</div><PurchaseStatusBadge status={purchase.status} /></div>
            <div className="mt-3 flex items-center justify-between text-sm"><span className="text-gray-500">{purchase.purchaseItems?.length || 0} article(s)</span><span className="font-semibold text-teal-900">{Number(purchase.totalAmount || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} {purchase.currency || 'CDF'}</span></div>
            <div className="mt-3 flex items-center justify-end gap-1 text-xs font-semibold text-teal-800">Détails <ArrowUpRight className="h-3.5 w-3.5" /></div>
          </Link>)}</div>
          </>
        )}
      </div>
    </div>
  );
}
