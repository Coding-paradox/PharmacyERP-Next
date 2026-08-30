import { useParams, useNavigate } from 'react-router-dom';
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

  const { data: purchase, isLoading, error } = useQuery({
    queryKey: ['purchase', id],
    queryFn: () => purchasesService.findOne(id!),
    enabled: !!id,
  });

  const receiveMutation = useMutation({
    mutationFn: purchasesService.receive,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['purchase', id] });
      queryClient.invalidateQueries({ queryKey: ['purchases'] });
    },
  });

  const handleReceive = async () => {
    if (confirm('Confirmer la réception de cet achat ? Les stocks seront mis à jour.')) {
      try {
        await receiveMutation.mutateAsync(id!);
      } catch (err: any) {
        alert(err.response?.data?.message || 'Erreur lors de la réception');
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

  if (error || !purchase) {
    return <div className="rounded-lg bg-red-50 p-4 text-red-800">Achat non trouvé</div>;
  }

  const currency = purchase.currency || 'CDF';

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/purchases')}
            className="rounded-lg p-2 hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-500" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900">{purchase.invoiceNumber}</h1>
            <p className="text-sm text-gray-500">Détails de la commande d'achat</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {purchase.status === 'PENDING' && (
            <button
              onClick={handleReceive}
              disabled={receiveMutation.isPending}
              className="inline-flex items-center gap-2 rounded-lg bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800 transition-colors disabled:opacity-50"
            >
              <CheckCircle className="h-4 w-4" />
              {receiveMutation.isPending ? 'Traitement...' : 'Réceptionner'}
            </button>
          )}
          <button className="inline-flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors">
            <Printer className="h-4 w-4" />
            Imprimer
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4 mb-6">
        <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase">Statut</p>
          <div className="mt-1">
            <PurchaseStatusBadge status={purchase.status} />
          </div>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase">Fournisseur</p>
          <p className="mt-1 font-medium text-gray-900">{purchase.supplierName}</p>
          {purchase.supplierPhone && (
            <p className="text-sm text-gray-500">{purchase.supplierPhone}</p>
          )}
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase">Total</p>
          <p className="mt-1 text-lg font-bold text-teal-700">{purchase.totalAmount.toFixed(2)} {currency}</p>
        </div>
        <div className="bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase">Date</p>
          <p className="mt-1 text-sm text-gray-900">{formatDate(purchase.createdAt)}</p>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-100 shadow-sm overflow-hidden">
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
                  <td className="px-6 py-4 text-right text-sm text-gray-600">{item.unitPrice.toFixed(2)} {item.currency || currency}</td>
                  <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">{item.totalPrice.toFixed(2)} {item.currency || currency}</td>
                  <td className="px-6 py-4 text-sm text-gray-500">{item.batchNumber || '-'}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={3} className="px-6 py-4 text-right font-medium text-gray-900">Sous-total</td>
                <td className="px-6 py-4 text-right font-medium text-gray-900">{purchase.netAmount.toFixed(2)} {currency}</td>
                <td></td>
              </tr>
              {purchase.tax > 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-right font-medium text-gray-900">Taxe</td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900">+{purchase.tax.toFixed(2)} {currency}</td>
                  <td></td>
                </tr>
              )}
              <tr className="border-t border-gray-200">
                <td colSpan={3} className="px-6 py-4 text-right text-base font-bold text-gray-900">Total</td>
                <td className="px-6 py-4 text-right text-base font-bold text-teal-700">{purchase.totalAmount.toFixed(2)} {currency}</td>
                <td></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {purchase.notes && (
        <div className="mt-4 bg-white rounded-lg border border-gray-100 p-4 shadow-sm">
          <p className="text-xs font-medium text-gray-500 uppercase">Notes</p>
          <p className="mt-1 text-sm text-gray-700">{purchase.notes}</p>
        </div>
      )}
    </div>
  );
}
