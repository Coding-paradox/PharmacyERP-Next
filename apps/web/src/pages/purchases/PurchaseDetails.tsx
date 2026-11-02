import { useParams, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Package, Printer, CheckCircle } from 'lucide-react';
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

export function PurchaseDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [showReceiveDialog, setShowReceiveDialog] = useState(false);

  const { data: purchase, isLoading, error } = useQuery({
    queryKey: ['purchase', id],
    queryFn: () => purchasesService.findOne(id!),
    enabled: !!id,
  });

  const receiveMutation = useMutation({
    mutationFn: purchasesService.receive,
    onSuccess: () => {
      setShowReceiveDialog(false);
      queryClient.invalidateQueries({ queryKey: ['purchase', id] });
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
      queryClient.invalidateQueries({ queryKey: ['purchases-summary'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-summary'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-movements'] });
      queryClient.invalidateQueries({ queryKey: ['inventory-expiry-alerts'] });
    },
  });

  const handleReceive = () => receiveMutation.mutate(id!);

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

  if (error || !purchase) {
    return <div className="rounded-lg bg-red-50 p-4 text-red-800">Achat non trouvé</div>;
  }

  const currency = purchase.currency || 'CDF';

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/purchases')}
            className="rounded-xl border border-gray-200 bg-white p-2.5 shadow-sm transition hover:bg-gray-50"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </button>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-teal-700">Commande fournisseur</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-gray-950">{purchase.invoiceNumber}</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {purchase.status === 'PENDING' && (
            <button
              onClick={() => setShowReceiveDialog(true)}
              disabled={receiveMutation.isPending}
              className="inline-flex items-center gap-2 rounded-xl bg-teal-800 px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-teal-900 transition-colors disabled:opacity-50"
            >
              <CheckCircle className="h-4 w-4" />
              {receiveMutation.isPending ? 'Traitement...' : 'Réceptionner'}
            </button>
          )}
          <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50 transition-colors print:hidden">
            <Printer className="h-4 w-4" />
            Imprimer
          </button>
        </div>
      </div>

      {receiveMutation.isSuccess && <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">Réception enregistrée. Les stocks et les lots ont été mis à jour.</div>}
      {receiveMutation.isError && <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{(receiveMutation.error as any)?.response?.data?.message || 'La réception a échoué. Vérifiez le lot et la date de péremption.'}</div>}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase">Statut</p>
          <div className="mt-1">
            <PurchaseStatusBadge status={purchase.status} />
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase">Fournisseur</p>
          <p className="mt-1 font-medium text-gray-900">{purchase.supplierName}</p>
          {purchase.supplierInvoiceNumber && <p className="mt-1 text-xs text-gray-500">Facture fournisseur : {purchase.supplierInvoiceNumber}</p>}
          {purchase.supplierPhone && (
            <p className="text-sm text-gray-500">{purchase.supplierPhone}</p>
          )}
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase">Total</p>
          <p className="mt-1 text-lg font-bold text-teal-800">{Number(purchase.totalAmount).toFixed(2)} {currency}</p>
        </div>
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase">Date</p>
          <p className="mt-1 text-sm text-gray-900">{formatDate(purchase.createdAt)}</p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
            <Package className="h-5 w-5 text-teal-600" />
            Articles
          </h2>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Médicament</th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Qté</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Prix unit.</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Total</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Lot</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Péremption</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {purchase.purchaseItems?.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-900">
                    {item.medicine?.name || 'Inconnu'}
                    <span className="text-xs text-gray-400 ml-2">{item.medicine?.code}</span>
                  </td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">{item.quantity}</td>
                  <td className="px-6 py-4 text-right text-sm text-gray-600">{Number(item.unitPrice).toFixed(2)} {item.currency || currency}</td>
                  <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">{Number(item.totalPrice).toFixed(2)} {item.currency || currency}</td>
                  <td className="px-6 py-4 text-sm text-gray-700">{item.batchNumber || '-'}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{item.expiryDate ? new Date(item.expiryDate).toLocaleDateString('fr-FR') : '—'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={4} className="px-6 py-4 text-right font-medium text-gray-900">Sous-total</td>
                <td className="px-6 py-4 text-right font-medium text-gray-900">{Number(purchase.netAmount).toFixed(2)} {currency}</td>
                <td></td>
              </tr>
              {purchase.tax > 0 && (
                <tr>
                  <td colSpan={4} className="px-6 py-4 text-right font-medium text-gray-900">Taxe</td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900">+{Number(purchase.tax).toFixed(2)} {currency}</td>
                  <td></td>
                </tr>
              )}
              <tr className="border-t border-gray-200">
                <td colSpan={4} className="px-6 py-4 text-right text-base font-bold text-gray-900">Total</td>
                <td className="px-6 py-4 text-right text-base font-bold text-teal-800">{Number(purchase.totalAmount).toFixed(2)} {currency}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {purchase.notes && (
        <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase">Notes</p>
          <p className="mt-1 text-sm text-gray-700">{purchase.notes}</p>
        </div>
      )}

      {showReceiveDialog && <div className="fixed inset-0 z-50 flex items-center justify-center bg-gray-950/40 p-4" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setShowReceiveDialog(false); }}>
        <div role="dialog" aria-modal="true" aria-labelledby="receive-title" className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
          <div className="mb-4 inline-flex rounded-xl bg-teal-50 p-3 text-teal-800"><CheckCircle className="h-5 w-5" /></div>
          <h2 id="receive-title" className="text-lg font-bold text-gray-950">Confirmer la réception ?</h2>
          <p className="mt-2 text-sm leading-6 text-gray-600">Les {purchase.purchaseItems.length} ligne(s) seront ajoutées au stock avec leurs lots et dates de péremption. Cette action ne peut être effectuée qu’une fois.</p>
          <div className="mt-6 flex justify-end gap-3">
            <button onClick={() => setShowReceiveDialog(false)} disabled={receiveMutation.isPending} className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">Retour</button>
            <button onClick={handleReceive} disabled={receiveMutation.isPending} className="rounded-xl bg-teal-800 px-4 py-2.5 text-sm font-semibold text-white hover:bg-teal-900 disabled:opacity-60">{receiveMutation.isPending ? 'Réception en cours…' : 'Confirmer la réception'}</button>
          </div>
        </div>
      </div>}
    </div>
  );
}
