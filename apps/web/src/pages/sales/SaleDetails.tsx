import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Printer } from 'lucide-react';
import { salesService } from '../../services/sales.service';

export function SaleDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: sale, isLoading, error } = useQuery({
    queryKey: ['sale', id],
    queryFn: () => salesService.findOne(id!),
    enabled: !!id,
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

  if (error || !sale) {
    return <div className="rounded-md bg-red-50 p-4 text-red-800">Vente non trouvée</div>;
  }

  const statusColors: Record<string, string> = {
    PENDING: 'bg-yellow-100 text-yellow-800',
    PAID: 'bg-green-100 text-green-800',
    CANCELLED: 'bg-red-100 text-red-800',
    REFUNDED: 'bg-gray-100 text-gray-800',
  };

  const statusLabels: Record<string, string> = {
    PENDING: 'En attente',
    PAID: 'Payée',
    CANCELLED: 'Annulée',
    REFUNDED: 'Remboursée',
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
  const currency = sale.currency || 'CDF';

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate('/sales')} className="rounded p-1 hover:bg-gray-100">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">Vente #{sale.invoiceNumber}</h1>
        </div>
        <button className="inline-flex items-center gap-2 rounded-md bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300">
          <Printer className="h-4 w-4" />
          Imprimer
        </button>
      </div>

      <div className="mt-6 grid gap-6 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-medium text-gray-500">Client</h3>
          <p className="mt-1 text-gray-900">{sale.customerName || 'Non renseigné'}</p>
          {sale.customerPhone && <p className="text-sm text-gray-600">{sale.customerPhone}</p>}
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-medium text-gray-500">Statut</h3>
          <span className={`mt-1 inline-flex rounded-full px-2 py-1 text-xs font-medium ${statusColors[sale.status]}`}>
            {statusLabels[sale.status] || sale.status}
          </span>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6">
          <h3 className="text-sm font-medium text-gray-500">Date</h3>
          <p className="mt-1 text-gray-900">{formatDate(sale.createdAt)}</p>
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-gray-200 bg-white">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Médicament</th>
                <th className="px-6 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Qté</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Prix unit.</th>
                <th className="px-6 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {sale.saleItems?.map((item: any) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-900">{item.medicine?.name || item.medicineId}</td>
                  <td className="px-6 py-4 text-center text-sm text-gray-600">{item.quantity}</td>
                  <td className="px-6 py-4 text-right text-sm text-gray-600">{item.unitPrice?.toFixed(2)} {item.currency || currency}</td>
                  <td className="px-6 py-4 text-right text-sm font-medium text-gray-900">{item.totalPrice?.toFixed(2)} {item.currency || currency}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50">
              <tr>
                <td colSpan={3} className="px-6 py-4 text-right font-medium text-gray-900">Sous-total</td>
                <td className="px-6 py-4 text-right font-medium text-gray-900">{sale.netAmount?.toFixed(2)} {currency}</td>
              </tr>
              {sale.discount > 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-right font-medium text-red-600">Remise</td>
                  <td className="px-6 py-4 text-right font-medium text-red-600">-{sale.discount?.toFixed(2)} {currency}</td>
                </tr>
              )}
              {sale.tax > 0 && (
                <tr>
                  <td colSpan={3} className="px-6 py-4 text-right font-medium text-gray-900">Taxe</td>
                  <td className="px-6 py-4 text-right font-medium text-gray-900">+{sale.tax?.toFixed(2)} {currency}</td>
                </tr>
              )}
              <tr>
                <td colSpan={3} className="px-6 py-4 text-right text-lg font-bold text-gray-900">Total</td>
                <td className="px-6 py-4 text-right text-lg font-bold text-teal-700">{sale.totalAmount?.toFixed(2)} {currency}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
