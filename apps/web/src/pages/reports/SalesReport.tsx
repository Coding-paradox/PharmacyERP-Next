import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsService } from '../../services/reports.service';
import {
  TrendingUp,
  ShoppingCart,
  DollarSign,
  Calendar,
  Loader2,
} from 'lucide-react';

export function SalesReport() {
  const [period, setPeriod] = useState('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['sales-report', period, startDate, endDate],
    queryFn: () => reportsService.getSalesReport({ period, startDate, endDate }),
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
      </div>
    );
  }

  if (error) {
    console.error('Report error:', error);
    return <div className="rounded-md bg-red-50 p-4 text-red-800">Erreur lors du chargement du rapport</div>;
  }

  const stats = [
    { label: "Chiffre d'affaires", value: `${Number(data?.summary?.totalRevenue ?? 0).toFixed(0)} CDF`, icon: DollarSign },
    { label: 'Nombre de ventes', value: data?.summary.totalSales || 0, icon: ShoppingCart },
    { label: 'Panier moyen', value: `${Number(data?.summary?.averageTicket ?? 0).toFixed(0)} CDF`, icon: TrendingUp },
    { label: 'Période', value: data?.summary.period || 'Mois', icon: Calendar },
  ];

  return (
    <div>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">Rapport des ventes</h1>
          <p className="mt-1 text-sm text-gray-500">Ventes, chiffre d’affaires et produits par période.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="rounded-md border border-gray-300 px-4 py-2 focus:border-teal-600 focus:outline-none focus:ring-teal-600"
          >
            <option value="today">Aujourd'hui</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="year">Cette année</option>
            <option value="custom">Personnalisé</option>
          </select>

          {period === 'custom' && (
            <>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 focus:border-teal-600 focus:outline-none focus:ring-teal-600"
              />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="rounded-md border border-gray-300 px-3 py-2 focus:border-teal-600 focus:outline-none focus:ring-teal-600"
              />
            </>
          )}
        </div>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4 sm:gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="flex items-center gap-4 rounded-2xl border border-teal-900/5 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md sm:p-5">
            <div className="rounded-xl bg-teal-50 p-3 text-teal-800">
              <stat.icon className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm text-gray-500">{stat.label}</p>
              <p className="text-xl font-bold text-gray-900">{stat.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900">Top 10 médicaments</h2>
        <div className="mt-4">
          {data?.topMedicines.length === 0 || data?.topMedicines[0]?.name === 'Aucune donnée' ? (
            <p className="text-sm text-gray-500">Aucune donnée disponible</p>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">#</th>
                  <th className="px-4 py-2 text-left text-xs font-medium uppercase tracking-wider text-gray-500">Médicament</th>
                  <th className="px-4 py-2 text-center text-xs font-medium uppercase tracking-wider text-gray-500">Quantité</th>
                  <th className="px-4 py-2 text-right text-xs font-medium uppercase tracking-wider text-gray-500">Chiffre d'affaires</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {data?.topMedicines.map((item: any, index: number) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-2 text-sm">
                      {index + 1 <= 3 ? (
                        <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-teal-100 text-sm font-bold text-teal-700">
                          {index + 1}
                        </span>
                      ) : (
                        <span className="text-gray-500">{index + 1}</span>
                      )}
                    </td>
                    <td className="px-4 py-2 text-sm text-gray-900">{item.name}</td>
                    <td className="px-4 py-2 text-center text-sm text-gray-600">{item.quantity}</td>
                    <td className="px-4 py-2 text-right text-sm font-medium text-gray-900">{Number(item.revenue ?? 0).toFixed(0)} CDF</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-2xl border border-gray-200/80 bg-white p-4 shadow-sm sm:p-6">
        <h2 className="text-lg font-semibold text-gray-900">Ventes quotidiennes</h2>
        <div className="mt-4">
          {data?.dailySales.length === 0 ? (
            <p className="text-sm text-gray-500">Aucune donnée disponible</p>
          ) : (
            <div className="space-y-2">
              {data?.dailySales.map((day: any) => (
                <div key={day.date} className="flex items-center justify-between border-b border-gray-100 py-2">
                  <span className="text-sm text-gray-600">{new Date(day.date).toLocaleDateString('fr-FR')}</span>
                  <div className="flex items-center gap-6">
                    <span className="text-sm text-gray-600">{day.count} ventes</span>
                    <span className="text-sm font-medium text-gray-900">{Number(day.revenue ?? 0).toFixed(0)} CDF</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
