import axios, { AxiosInstance } from "axios";
import { IAnalyticsAPI } from "./IAnalyticsAPI";
import { FiscalReceiptDTO, AnalysisReportDTO, SalesTrendDTO, TopPerfumeDTO } from "../../models/analytics/AnalyticsDTO";

export class AnalyticsAPI implements IAnalyticsAPI {
  private readonly ax: AxiosInstance;

  constructor() {
    this.ax = axios.create({
      baseURL: import.meta.env.VITE_GATEWAY_URL,
      headers: { "Content-Type": "application/json" },
    });
  }

  private h(token: string) {
    return { headers: { Authorization: `Bearer ${token}` } };
  }

  async getReceipts(token: string, from?: string, to?: string): Promise<FiscalReceiptDTO[]> {
    const params: any = {};
    if (from) params.from = from;
    if (to) params.to = to;
    const res = await this.ax.get("/analytics/receipts", { ...this.h(token), params });
    const receipts = res.data?.data || res.data;
    // Convert totalAmount from string/decimal to number, plus nested item prices
    return Array.isArray(receipts) ? receipts.map(r => ({
      ...r,
      totalAmount: parseFloat(r.totalAmount),
      items: r.items?.map((item: any) => ({
        ...item,
        price: parseFloat(item.price)
      })) || []
    })) : receipts;
  }

  async getReceiptById(token: string, id: string): Promise<FiscalReceiptDTO> {
    const res = await this.ax.get(`/analytics/receipts/${id}`, this.h(token));
    const receipt = res.data?.data || res.data;
    if (!receipt) return receipt;
    // Convert totalAmount from string/decimal to number, plus nested item prices
    return {
      ...receipt,
      totalAmount: parseFloat(receipt.totalAmount),
      items: receipt.items?.map((item: any) => ({
        ...item,
        price: parseFloat(item.price)
      })) || []
    };
  }

  async getSalesTotal(token: string, period?: string): Promise<any> {
    const params: any = {};
    if (period) params.period = period;
    const res = await this.ax.get("/analytics/sales/total", { ...this.h(token), params });
    const data = res.data?.data || res.data;
    if (!data) return data;
    // Convert DECIMAL fields to numbers
    return {
      ...data,
      totalRevenue: data.totalRevenue ? parseFloat(data.totalRevenue) : 0,
      totalReceipts: data.totalReceipts || 0,
      totalItemsSold: data.totalItemsSold || 0,
      averageOrderValue: data.averageOrderValue ? parseFloat(data.averageOrderValue) : 0
    };
  }

  async getSalesTrend(token: string, period?: string): Promise<SalesTrendDTO[]> {
    const params: any = {};
    if (period) params.period = period;
    const res = await this.ax.get("/analytics/sales/trend", { ...this.h(token), params });
    const trends = res.data?.data || res.data;
    // Convert totalAmount from string/decimal to number
    return Array.isArray(trends) ? trends.map(t => ({
      ...t,
      totalAmount: parseFloat(t.totalAmount)
    })) : trends;
  }

  async getTop10(token: string, period?: string): Promise<TopPerfumeDTO[]> {
    const params: any = {};
    if (period) params.period = period;
    const res = await this.ax.get("/analytics/sales/top10", { ...this.h(token), params });
    const perfumes = res.data?.data || res.data;
    // Convert revenue from string/decimal to number
    return Array.isArray(perfumes) ? perfumes.map(p => ({
      ...p,
      revenue: parseFloat(p.revenue)
    })) : perfumes;
  }

  async getReports(token: string): Promise<AnalysisReportDTO[]> {
    const res = await this.ax.get("/analytics/reports", this.h(token));
    return res.data?.data || res.data;
  }

  async getReportById(token: string, id: string): Promise<AnalysisReportDTO> {
    const res = await this.ax.get(`/analytics/reports/${id}`, this.h(token));
    return res.data?.data || res.data;
  }

  async exportReport(token: string, reportId: string): Promise<Blob> {
    const res = await this.ax.post(
      "/analytics/reports/export",
      { reportId },
      { ...this.h(token), responseType: "blob" }
    );
    return res.data;
  }
}
