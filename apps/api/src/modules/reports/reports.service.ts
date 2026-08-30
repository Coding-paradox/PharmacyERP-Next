import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@pharmacy/database';
import { ReportQueryDto, ReportPeriod } from './dto/report-query.dto';
import { Currency } from '@prisma/client';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private readonly prisma: PrismaService) {}

  private emptyCurrencyTotals(): Record<Currency, number> {
    return {
      [Currency.CDF]: 0,
      [Currency.USD]: 0,
    };
  }

  private getDateRange(period: ReportPeriod, startDate?: string, endDate?: string): { gte: Date; lte: Date } {
    const now = new Date();
    let start: Date;
    let end: Date = new Date(now);

    if (period === ReportPeriod.CUSTOM && startDate && endDate) {
      return {
        gte: new Date(startDate),
        lte: new Date(endDate + 'T23:59:59'),
      };
    }

    switch (period) {
      case ReportPeriod.TODAY:
        start = new Date(now.setHours(0, 0, 0, 0));
        end = new Date(now.setHours(23, 59, 59, 999));
        break;
      case ReportPeriod.WEEK:
        start = new Date(now);
        start.setDate(now.getDate() - 7);
        break;
      case ReportPeriod.MONTH:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case ReportPeriod.YEAR:
        start = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        start = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return { gte: start, lte: end };
  }

  async getSalesReport(pharmacyId: string, query: ReportQueryDto) {
    try {
      const { period = ReportPeriod.MONTH, startDate, endDate } = query;
      const dateRange = this.getDateRange(period, startDate, endDate);

      const sales = await this.prisma.sale.findMany({
        where: {
          pharmacyId,
          createdAt: dateRange,
          status: 'PAID',
        },
        include: {
          saleItems: {
            include: {
              medicine: {
                select: {
                  name: true,
                  code: true,
                  costPrice: true,
                },
              },
            },
          },
          user: {
            select: {
              firstName: true,
              lastName: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });

      const revenueByCurrency = this.emptyCurrencyTotals();
      for (const sale of sales) {
        revenueByCurrency[sale.currency] += sale.totalAmount.toNumber();
      }
      const totalRevenue = revenueByCurrency[Currency.CDF];
      const totalSales = sales.length;
      const averageTicket = totalSales > 0 ? totalRevenue / totalSales : 0;

      // Top médicaments
      const medicineSales: Record<string, { name: string; code: string; quantity: number; revenue: number; currency: Currency }> = {};
      for (const sale of sales) {
        for (const item of sale.saleItems) {
          const key = `${item.medicineId}-${item.currency}`;
          if (!medicineSales[key]) {
            medicineSales[key] = {
              name: item.medicine?.name || 'Inconnu',
              code: item.medicine?.code || '',
              quantity: 0,
              revenue: 0,
              currency: item.currency,
            };
          }
          medicineSales[key].quantity += item.quantity;
          medicineSales[key].revenue += item.totalPrice.toNumber();
        }
      }

      const topMedicines = Object.values(medicineSales)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      // Ventes par jour
      const dailySales: Record<string, { count: number; revenue: number; currencyBreakdown: Record<Currency, number> }> = {};
      for (const sale of sales) {
        const date = sale.createdAt.toISOString().split('T')[0];
        if (!dailySales[date]) {
          dailySales[date] = { count: 0, revenue: 0, currencyBreakdown: this.emptyCurrencyTotals() };
        }
        dailySales[date].count++;
        dailySales[date].currencyBreakdown[sale.currency] += sale.totalAmount.toNumber();
        dailySales[date].revenue = dailySales[date].currencyBreakdown[Currency.CDF];
      }

      return {
        summary: {
          totalRevenue,
          totalSales,
          averageTicket,
          currency: Currency.CDF,
          currencyBreakdown: revenueByCurrency,
          period,
          startDate: dateRange.gte,
          endDate: dateRange.lte,
        },
        topMedicines: topMedicines.length > 0 ? topMedicines : [{ name: 'Aucune donnée', code: '', quantity: 0, revenue: 0, currency: Currency.CDF }],
        dailySales: Object.entries(dailySales).map(([date, data]) => ({ date, ...data })),
        sales: sales.slice(0, 50),
      };
    } catch (error) {
      this.logger.error(`Error generating sales report: ${error}`);
      return {
        summary: {
          totalRevenue: 0,
          totalSales: 0,
          averageTicket: 0,
          currency: Currency.CDF,
          currencyBreakdown: this.emptyCurrencyTotals(),
          period: 'month',
          startDate: new Date(),
          endDate: new Date(),
        },
        topMedicines: [{ name: 'Aucune donnée', code: '', quantity: 0, revenue: 0, currency: Currency.CDF }],
        dailySales: [],
        sales: [],
      };
    }
  }

  async getInventoryReport(pharmacyId: string) {
    try {
      const medicines = await this.prisma.medicine.findMany({
        where: {
          pharmacyId,
          deletedAt: null,
        },
        include: {
          category: {
            select: { name: true },
          },
        },
        orderBy: { stock: 'asc' },
      });

      const stockValueByCurrency = this.emptyCurrencyTotals();
      for (const medicine of medicines) {
        stockValueByCurrency[medicine.costCurrency] += medicine.stock * medicine.costPrice.toNumber();
      }
      const totalStockValue = stockValueByCurrency[Currency.CDF];
      const lowStock = medicines.filter((m) => m.stock <= m.minStock && m.isActive);
      const outOfStock = medicines.filter((m) => m.stock === 0 && m.isActive);

      const byCategory: Record<string, { count: number; stock: number; value: number; currencyBreakdown: Record<Currency, number> }> = {};
      for (const m of medicines) {
        const cat = m.category?.name || 'Non catégorisé';
        if (!byCategory[cat]) {
          byCategory[cat] = { count: 0, stock: 0, value: 0, currencyBreakdown: this.emptyCurrencyTotals() };
        }
        byCategory[cat].count++;
        byCategory[cat].stock += m.stock;
        byCategory[cat].currencyBreakdown[m.costCurrency] += m.stock * m.costPrice.toNumber();
        byCategory[cat].value = byCategory[cat].currencyBreakdown[Currency.CDF];
      }

      return {
        summary: {
          totalMedicines: medicines.length,
          totalStockValue,
          currency: Currency.CDF,
          currencyBreakdown: stockValueByCurrency,
          lowStockCount: lowStock.length,
          outOfStockCount: outOfStock.length,
        },
        byCategory: Object.entries(byCategory).map(([name, data]) => ({ name, ...data })),
        lowStock: lowStock.map((m) => ({
          id: m.id,
          name: m.name,
          code: m.code,
          stock: m.stock,
          minStock: m.minStock,
          category: m.category?.name,
        })),
        outOfStock: outOfStock.map((m) => ({
          id: m.id,
          name: m.name,
          code: m.code,
          category: m.category?.name,
        })),
      };
    } catch (error) {
      this.logger.error(`Error generating inventory report: ${error}`);
      return {
        summary: {
          totalMedicines: 0,
          totalStockValue: 0,
          currency: Currency.CDF,
          currencyBreakdown: this.emptyCurrencyTotals(),
          lowStockCount: 0,
          outOfStockCount: 0,
        },
        byCategory: [],
        lowStock: [],
        outOfStock: [],
      };
    }
  }

  async getDashboardStats(pharmacyId: string) {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [totalMedicines, totalSales, revenueGroups, todayRevenueGroups, todaySales, lowStock, totalCustomers] = await Promise.all([
        this.prisma.medicine.count({ where: { pharmacyId, deletedAt: null } }),
        this.prisma.sale.count({ where: { pharmacyId, status: 'PAID' } }),
        this.prisma.sale.groupBy({
          by: ['currency'],
          where: { pharmacyId, status: 'PAID' },
          _sum: { totalAmount: true },
        }),
        this.prisma.sale.groupBy({
          by: ['currency'],
          where: {
            pharmacyId,
            status: 'PAID',
            createdAt: { gte: today },
          },
          _sum: { totalAmount: true },
        }),
        this.prisma.sale.count({
          where: {
            pharmacyId,
            status: 'PAID',
            createdAt: { gte: today },
          },
        }),
        this.prisma.medicine.count({
          where: {
            pharmacyId,
            deletedAt: null,
            stock: { lte: this.prisma.medicine.fields.minStock },
            isActive: true,
          },
        }),
        this.prisma.customer.count({ where: { pharmacyId } }),
      ]);

      const totalRevenueByCurrency = this.emptyCurrencyTotals();
      for (const group of revenueGroups) {
        totalRevenueByCurrency[group.currency] = group._sum.totalAmount?.toNumber() || 0;
      }

      const todayRevenueByCurrency = this.emptyCurrencyTotals();
      for (const group of todayRevenueGroups) {
        todayRevenueByCurrency[group.currency] = group._sum.totalAmount?.toNumber() || 0;
      }

      return {
        totalMedicines,
        totalSales,
        totalRevenue: totalRevenueByCurrency[Currency.CDF],
        totalRevenueByCurrency,
        todayRevenue: todayRevenueByCurrency[Currency.CDF],
        todayRevenueByCurrency,
        currency: Currency.CDF,
        todaySalesCount: todaySales,
        lowStock,
        totalCustomers,
      };
    } catch (error) {
      this.logger.error(`Error getting dashboard stats: ${error}`);
      return {
        totalMedicines: 0,
        totalSales: 0,
        totalRevenue: 0,
        totalRevenueByCurrency: this.emptyCurrencyTotals(),
        todayRevenue: 0,
        todayRevenueByCurrency: this.emptyCurrencyTotals(),
        currency: Currency.CDF,
        todaySalesCount: 0,
        lowStock: 0,
        totalCustomers: 0,
      };
    }
  }
}
