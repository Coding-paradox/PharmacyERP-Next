import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Edit } from 'lucide-react';
import { Currency, medicinesService } from '../../services/medicines.service';

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

export function MedicineDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: medicine, isLoading, error } = useQuery({
    queryKey: ['medicine', id],
    queryFn: () => medicinesService.findOne(id!),
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

  if (error || !medicine) {
    return (
      <div className="rounded-md bg-red-50 p-4 text-red-800">
        Médicament non trouvé
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/medicines')}
            className="rounded p-1 hover:bg-gray-100"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
          <h1 className="text-2xl font-bold text-gray-900">{medicine.name}</h1>
        </div>
        <Link
          to={`/medicines/${medicine.id}/edit`}
          className="inline-flex items-center gap-2 rounded-md bg-teal-700 px-4 py-2 text-sm font-medium text-white hover:bg-teal-800"
        >
          <Edit className="h-4 w-4" />
          Modifier
        </Link>
      </div>

      <div className="mt-6 rounded-lg border border-gray-200 bg-white p-6">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <dt className="text-sm font-medium text-gray-500">Code</dt>
            <dd className="mt-1 text-sm text-gray-900">{medicine.code || '-'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Code-barres</dt>
            <dd className="mt-1 text-sm text-gray-900">{medicine.barcode || '-'}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Nom générique</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {typeof medicine.genericName === 'string'
                ? medicine.genericName
                : medicine.genericName?.name || '-'}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Dosage</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {typeof medicine.dosage === 'string'
                ? medicine.dosage
                : medicine.dosage?.name || '-'}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Forme galénique</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {typeof medicine.dosageForm === 'string'
                ? medicine.dosageForm
                : medicine.dosageForm?.name || '-'}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Prix d'achat</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {formatPrice(medicine.costPrice, medicine.costCurrency)}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Prix de vente</dt>
            <dd className="mt-1 text-sm text-gray-900">
              {formatPrice(medicine.sellingPrice, medicine.sellingCurrency)}
            </dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Stock</dt>
            <dd className="mt-1 text-sm text-gray-900">{formatNumber(medicine.stock)}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Seuil d'alerte</dt>
            <dd className="mt-1 text-sm text-gray-900">{formatNumber(medicine.minStock)}</dd>
          </div>
          <div>
            <dt className="text-sm font-medium text-gray-500">Statut</dt>
            <dd className="mt-1 text-sm text-gray-900">
              <span
                className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
                  medicine.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}
              >
                {medicine.isActive ? 'Actif' : 'Inactif'}
              </span>
            </dd>
          </div>
        </dl>
      </div>
    </div>
  );
}
