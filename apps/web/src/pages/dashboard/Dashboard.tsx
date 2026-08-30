import { useQuery } from '@tanstack/react-query';
import { useAuth } from '../../contexts/AuthContext';
import { medicinesService } from '../../services/medicines.service';
import { salesService } from '../../services/sales.service';
import { inventoryService } from '../../services/inventory.service';
import { reportsService } from '../../services/reports.service';
import {
  Package,
  ShoppingCart,
  AlertTriangle,
  TrendingUp,
  Users,
  DollarSign,
  Clock,
  Loader2,
} from 'lucide-react';

export function Dashboard() {
  const { user } = useAuth();

  const { data: medicines, isLoading: medicinesLoading } = useQuery({
    queryKey: ['medicines'],
    queryFn: () => medicinesService.findAll(),
  });

  const { data: sales, isLoading: salesLoading } = useQuery({
    queryKey: ['sales'],
    queryFn: () => salesService.findAll(),
  });

  const { data: inventory, isLoading: inventoryLoading } = useQuery({
    queryKey: ['inventory-summary'],
    queryFn: () => inventoryService.getSummary(),
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => reportsService.getDashboardStats(),
  });

  const isLoading = medicinesLoading || salesLoading || inventoryLoading || statsLoading;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  const totalMedicines = medicines?.data?.length || 0;
  const totalSales = sales?.length || 0;
  const totalRevenue = stats?.totalRevenue || 0;
  const todayRevenue = stats?.todayRevenue || 0;
  const todaySalesCount = stats?.todaySalesCount || 0;
  const lowStock = stats?.lowStock || 0;
  const totalCustomers = stats?.totalCustomers || 0;

  const statsCards = [
    {
      title: 'Chiffre d\'affaires',
      value: `${totalRevenue.toFixed(0)} CDF`,
      icon: DollarSign,
      color: 'bg-emerald-500',
      textColor: 'text-emerald-600',
    },
    {
      title: 'Ventes aujourd\'hui',
      value: `${todaySalesCount} ventes`,
      subtitle: `${todayRevenue.toFixed(0)} CDF`,
      icon: ShoppingCart,
      color: 'bg-blue-500',
      textColor: 'text-blue-600',
    },
    {
      title: 'Total médicaments',
      value: totalMedicines,
      icon: Package,
      color: 'bg-purple-500',
      textColor: 'text-purple-600',
    },
    {
      title: 'Clients',
      value: totalCustomers,
      icon: Users,
      color: 'bg-teal-500',
      textColor: 'text-teal-600',
    },
  ];

  const recentSales = sales?.slice(0, 5) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PAID': return 'bg-green-100 text-green-700';
      case 'PENDING': return 'bg-yellow-100 text-yellow-700';
      case 'CANCELLED': return 'bg-red-100 text-red-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PAID': return 'Payée';
      case 'PENDING': return 'En attente';
      case 'CANCELLED': return 'Annulée';
      default: return status;
    }
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              Bonjour, {user?.firstName} {user?.lastName}
            </h1>
            <p className="text-sm text-gray-500">Vue d'ensemble de votre activité</p>
          </div>
          <div className="mt-2 sm:mt-0">
            <span className="inline-flex items-center gap-2 rounded-full bg-teal-50 px-3 py-1.5 text-xs text-teal-700">
              <Clock className="h-3 w-3" />
              {new Date().toLocaleDateString('fr-FR', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statsCards.map((stat, index) => (
          <div key={index} className="bg-white rounded-lg p-4 shadow-sm border border-gray-100">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">{stat.title}</p>
                <p className="mt-1 text-xl font-bold text-gray-900">{stat.value}</p>
                {stat.subtitle && (
                  <p className="text-xs text-gray-500">{stat.subtitle}</p>
                )}
              </div>
              <div className={`rounded-lg p-2 ${stat.color} bg-opacity-10`}>
                <stat.icon className={`h-4 w-4 ${stat.textColor}`} />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Alertes stock */}
      {lowStock > 0 && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 p-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <p className="text-sm font-medium text-amber-800">
              {lowStock} médicament(s) en stock critique
            </p>
          </div>
        </div>
      )}

      {/* Dernières ventes */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-semibold text-gray-900">Dernières ventes</h2>
          <button className="text-sm text-teal-600 hover:text-teal-800 font-medium">
            Voir tout →
          </button>
        </div>

        <div className="bg-white rounded-lg border border-gray-100 overflow-hidden">
          {recentSales.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8">
              <ShoppingCart className="h-10 w-10 text-gray-300" />
              <p className="mt-2 text-sm text-gray-500">Aucune vente enregistrée</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">N° Facture</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Client</th>
                  <th className="px-4 py-2.5 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Total</th>
                  <th className="px-4 py-2.5 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Statut</th>
                  <th className="px-4 py-2.5 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {recentSales.map((sale: any) => (
                  <tr key={sale.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {sale.invoiceNumber}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {sale.customerName || 'Client non renseigné'}
                    </td>
                    <td className="px-4 py-3 text-right text-sm font-medium text-gray-900">
                      {sale.totalAmount?.toFixed(2)} CDF
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(sale.status)}`}>
                        {getStatusLabel(sale.status)}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {formatDate(sale.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <button className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-all hover:border-teal-300 hover:bg-teal-50/50 hover:text-teal-700">
          <Package className="h-4 w-4 text-teal-600" />
          Nouveau médicament
        </button>
        <button className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-all hover:border-teal-300 hover:bg-teal-50/50 hover:text-teal-700">
          <ShoppingCart className="h-4 w-4 text-teal-600" />
          Nouvelle vente
        </button>
        <button className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-all hover:border-teal-300 hover:bg-teal-50/50 hover:text-teal-700">
          <Users className="h-4 w-4 text-teal-600" />
          Nouveau client
        </button>
        <button className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-3 text-sm font-medium text-gray-700 transition-all hover:border-teal-300 hover:bg-teal-50/50 hover:text-teal-700">
          <TrendingUp className="h-4 w-4 text-teal-600" />
          Voir les rapports
        </button>
      </div>
    </div>
  );
}