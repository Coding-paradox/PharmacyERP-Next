import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { salesService } from '../../services/sales.service';
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
  ArrowUpRight,
  Plus,
} from 'lucide-react';

function formatMoney(value: number): string {
  return `${new Intl.NumberFormat('fr-FR', { maximumFractionDigits: 0 }).format(value)} CDF`;
}

export function Dashboard() {
  const { user } = useAuth();

  const { data: sales, isLoading: salesLoading } = useQuery({
    queryKey: ['sales'],
    queryFn: () => salesService.findAll(),
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => reportsService.getDashboardStats(),
  });

  const isLoading = salesLoading || statsLoading;

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  const totalMedicines = stats?.totalMedicines || 0;
  const totalRevenue = stats?.totalRevenue || 0;
  const todayRevenue = stats?.todayRevenue || 0;
  const todaySalesCount = stats?.todaySalesCount || 0;
  const lowStock = stats?.lowStock || 0;
  const totalCustomers = stats?.totalCustomers || 0;

  const statsCards = [
    {
      title: 'Chiffre d\'affaires',
      value: formatMoney(totalRevenue),
      icon: DollarSign,
    },
    {
      title: 'Ventes aujourd\'hui',
      value: `${todaySalesCount} ventes`,
      subtitle: formatMoney(todayRevenue),
      icon: ShoppingCart,
    },
    {
      title: 'Total médicaments',
      value: totalMedicines,
      icon: Package,
    },
    {
      title: 'Clients',
      value: totalCustomers,
      icon: Users,
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
    <div className="mx-auto max-w-7xl space-y-5 sm:space-y-6">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-teal-950 via-teal-900 to-teal-800 px-5 py-5 text-white shadow-md shadow-teal-950/10 sm:px-7 sm:py-6">
        <div className="pointer-events-none absolute -right-10 -top-24 h-56 w-56 rounded-full border-[30px] border-white/[0.06]" />
        <div className="pointer-events-none absolute -bottom-28 right-44 h-48 w-48 rounded-full bg-teal-300/[0.08] blur-2xl" />
        <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-teal-100">Tableau de bord</p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-[1.75rem]">
              Bonjour, {user?.firstName}
            </h1>
            <p className="mt-1.5 max-w-xl text-sm text-teal-50/90">
              Synthèse de l’activité et des indicateurs de la pharmacie.
            </p>
            <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-3 py-1.5 text-xs capitalize text-teal-50">
              <Clock className="h-4 w-4" />
              {new Date().toLocaleDateString('fr-FR', {
                weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
              })}
            </p>
          </div>
          <Link to="/sales/new" className="inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-4 py-2 text-sm font-semibold text-teal-900 shadow-sm transition hover:bg-teal-50 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-teal-800">
            <Plus className="h-4 w-4" />
            Nouvelle vente
          </Link>
        </div>
      </section>

      {/* Stats Cards */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4 sm:gap-3.5">
        {statsCards.map((stat, index) => (
          <div key={index} className="group rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:border-teal-200 hover:shadow-md sm:p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.12em] text-gray-500">{stat.title}</p>
                <p className="mt-1.5 text-xl font-bold tracking-tight text-gray-950 sm:text-2xl">{stat.value}</p>
                {stat.subtitle && (
                  <p className="mt-1 text-xs text-gray-500">{stat.subtitle}</p>
                )}
              </div>
              <div className="rounded-xl bg-teal-50 p-2.5 text-teal-800 transition group-hover:bg-teal-100">
                <stat.icon className="h-[18px] w-[18px]" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Alertes stock */}
      <div className={`flex flex-col gap-3 rounded-2xl border p-3.5 sm:flex-row sm:items-center sm:justify-between ${lowStock > 0 ? 'border-amber-200 bg-amber-50/80' : 'border-teal-100 bg-white'}`}>
          <div className="flex items-center gap-3">
            <span className={`rounded-xl bg-white p-2 ${lowStock > 0 ? 'text-amber-700' : 'text-teal-800'}`}><AlertTriangle className="h-4 w-4" /></span>
            <div><p className={`text-sm font-semibold ${lowStock > 0 ? 'text-amber-950' : 'text-gray-900'}`}>{lowStock > 0 ? `${lowStock} médicament(s) à réapprovisionner` : 'Stock sous contrôle'}</p><p className="mt-0.5 text-xs text-gray-600">{lowStock > 0 ? 'Consultez les notifications et le détail dans le module Stocks.' : 'Surveillance active des seuils de stock.'}</p></div>
          </div>
          <Link to="/inventory" className={`inline-flex items-center gap-1 text-sm font-semibold ${lowStock > 0 ? 'text-amber-900' : 'text-teal-800'} hover:underline`}>Voir le stock <ArrowUpRight className="h-4 w-4" /></Link>
      </div>

      <div>
        <div className="mb-2.5 flex items-end justify-between gap-3">
          <div><h2 className="text-lg font-bold tracking-tight text-gray-900">Actions principales</h2></div>
        </div>
        <div className="grid gap-2.5 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { label: 'Ajouter un médicament', to: '/medicines/new', icon: Package },
            { label: 'Créer une vente', to: '/sales/new', icon: ShoppingCart },
            { label: 'Ajouter un client', to: '/customers/new', icon: Users },
            { label: 'Consulter les rapports', to: '/reports/sales', icon: TrendingUp },
          ].map((action) => (
            <Link key={action.to} to={action.to} className="group flex min-h-14 items-center justify-between gap-3 rounded-2xl border border-gray-200/80 bg-white px-3.5 py-2.5 text-sm font-semibold text-gray-700 shadow-sm transition hover:border-teal-200 hover:bg-teal-50/60 hover:text-teal-900 hover:shadow-md">
              <span className="flex items-center gap-2.5"><span className="rounded-xl bg-teal-50 p-2 text-teal-800 group-hover:bg-white"><action.icon className="h-4 w-4" /></span>{action.label}</span>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-gray-400 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-teal-800" />
            </Link>
          ))}
        </div>
      </div>

      {/* Dernières ventes */}
      <div>
        <div className="mb-2.5 flex items-end justify-between gap-3">
          <div>
            <h2 className="text-lg font-bold tracking-tight text-gray-900">Dernières ventes</h2>
            <p className="mt-0.5 text-xs text-gray-500">Historique des ventes récentes</p>
          </div>
          <Link to="/sales" className="inline-flex items-center gap-1 whitespace-nowrap text-sm font-semibold text-teal-800 hover:text-teal-950">Toutes les ventes <ArrowUpRight className="h-4 w-4" /></Link>
        </div>

        <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-sm">
          {recentSales.length === 0 ? (
            <div className="flex min-h-36 flex-col items-center justify-center px-5 py-6 text-center">
              <span className="rounded-2xl bg-teal-50 p-2.5 text-teal-700"><ShoppingCart className="h-5 w-5" /></span>
              <p className="mt-2.5 text-sm font-semibold text-gray-800">Aucune vente enregistrée</p>
              <Link to="/sales/new" className="mt-3 inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-teal-800 transition hover:bg-teal-50"><Plus className="h-4 w-4" />Enregistrer une vente</Link>
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
                      {Number(sale.totalAmount ?? 0).toFixed(2)} CDF
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

    </div>
  );
}
