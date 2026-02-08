import axios, { AxiosInstance } from "axios";
import { IPerformanceAPI } from "./IPerformanceAPI";
import { PerformanceReportDTO } from "../../models/performance/PerformanceDTO";

export class PerformanceAPI implements IPerformanceAPI {
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

  async simulate(token: string, algorithmName: string): Promise<any> {
    const res = await this.ax.post("/performance/simulate", { algorithmName }, this.h(token));
    const data = res.data?.data || res.data;
    if (!data) return data;
    // Convert efficiency from string/decimal to number
    return {
      ...data,
      efficiency: parseFloat(data.efficiency)
    };
  }

  async getReports(token: string): Promise<PerformanceReportDTO[]> {
    const res = await this.ax.get("/performance/reports", this.h(token));
    const reports = res.data?.data || res.data;
    // Convert efficiency from string/decimal to number
    return Array.isArray(reports) ? reports.map(r => ({
      ...r,
      efficiency: parseFloat(r.efficiency)
    })) : reports;
  }

  async getReportById(token: string, id: string): Promise<PerformanceReportDTO> {
    const res = await this.ax.get(`/performance/reports/${id}`, this.h(token));
    const report = res.data?.data || res.data;
    if (!report) return report;
    // Convert efficiency from string/decimal to number
    return {
      ...report,
      efficiency: parseFloat(report.efficiency)
    };
  }

  async exportReport(token: string, reportId: string): Promise<Blob> {
    const res = await this.ax.post(
      "/performance/reports/export",
      { reportId },
      { ...this.h(token), responseType: "blob" }
    );
    return res.data;
  }
}
