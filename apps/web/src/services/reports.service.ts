import { api } from './api';
import type { Currency } from './medicines.service';

export type CurrencyTotals = Record<Currency, number>;

export interface SalesReport {
  summary: {
    totalRevenue: number;
    totalSales: number;
    averageTicket: number;
    currency: Currency;
    currencyBreakdown: CurrencyTotals;
    period: string;
    startDate: string;
    endDate: string;
  };
  topMedicines: Array<{
    name: string;
    code: string;
    quantity: number;
    revenue: number;
    currency: Currency;
  }>;
  dailySales: Array<{
    date: string;
    count: number;
    revenue: number;
    currencyBreakdown: CurrencyTotals;
  }>;
  sales: Array<any>;
}

export interface InventoryReport {
  summary: {
    totalMedicines: number;
    totalStockValue: number;
    currency: Currency;
    currencyBreakdown: CurrencyTotals;
    lowStockCount: number;
    outOfStockCount: number;
  };
  byCategory: Array<{
    name: string;
    count: number;
    stock: number;
    value: number;
    currencyBreakdown: CurrencyTotals;
  }>;
  lowStock: Array<{
    id: string;
    name: string;
    code: string;
    stock: number;
    minStock: number;
    category?: string;
  }>;
  outOfStock: Array<{
    id: string;
    name: string;
    code: string;
    category?: string;
  }>;
}

export interface DashboardStats {
  totalMedicines: number;
  totalSales: number;
  totalRevenue: number;
  totalRevenueByCurrency: CurrencyTotals;
  todayRevenue: number;
  todayRevenueByCurrency: CurrencyTotals;
  currency: Currency;
  todaySalesCount: number;
  lowStock: number;
  totalCustomers: number;
}

class ReportsService {
  async getSalesReport(params: { period?: string; startDate?: string; endDate?: string }): Promise<SalesReport> {
    const queryParams: any = {};
    
    if (params.period) queryParams.period = params.period;
    if (params.startDate) queryParams.startDate = params.startDate;
    if (params.endDate) queryParams.endDate = params.endDate;

    const response = await api.get('/reports/sales', { params: queryParams });
    return response.data;
  }

  async getInventoryReport(): Promise<InventoryReport> {
    const response = await api.get('/reports/inventory');
    return response.data;
  }

  async getDashboardStats(): Promise<DashboardStats> {
    const response = await api.get('/reports/dashboard');
    return response.data;
  }
}

export const reportsService = new ReportsService();
