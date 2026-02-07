import { SalesReport, ReportPeriod, TopPerfumeData, TrendData } from '../models/SalesReport';

export interface SaleRecord {
  receiptId: number;
  saleType: string;
  items: Array<{
    perfumeId: number;
    perfumeName: string;
    quantity: number;
    unitPrice: number;
  }>;
  totalAmount: number;
  createdAt: Date;
  userId: number;
}

export interface SalesAnalysis {
  period: ReportPeriod;
  totalSales: number;
  totalRevenue: number;
  totalTransactions: number;
  averageOrderValue: number;
  startDate?: Date;
  endDate?: Date;
}

export interface TrendAnalysis {
  trendData: TrendData[];
  growthRate: number;
  peakPeriod: string;
}

export interface TopPerfume {
  perfumeId: number;
  perfumeName: string;
  quantity: number;
  revenue: number;
  percentage: number;
}

export interface IAnalyticsService {
  recordSale(data: SaleRecord): Promise<void>;
  getSalesByPeriod(period: ReportPeriod): Promise<SalesAnalysis>;
  getSalesTrend(): Promise<TrendAnalysis>;
  getTopTenPerfumes(): Promise<TopPerfume[]>;
  getTopTenRevenue(): Promise<TopPerfume[]>;
  generateReport(period: ReportPeriod, startDate?: Date, endDate?: Date): Promise<SalesReport>;
  getAllReports(): Promise<SalesReport[]>;
  getReportById(id: number): Promise<SalesReport | null>;
  exportToPdf(reportId: number): Promise<Buffer>;
}