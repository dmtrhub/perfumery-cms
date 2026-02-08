import { PerformanceReportDTO } from "../../models/performance/PerformanceDTO";

export interface IPerformanceAPI {
  simulate(token: string, algorithmName: string): Promise<any>;
  getReports(token: string): Promise<PerformanceReportDTO[]>;
  getReportById(token: string, id: string): Promise<PerformanceReportDTO>;
  exportReport(token: string, reportId: string): Promise<Blob>;
}
