import { FiscalReceiptDTO, AnalysisReportDTO, SalesTrendDTO, TopPerfumeDTO } from "../../models/analytics/AnalyticsDTO";

export interface IAnalyticsAPI {
  getReceipts(token: string, from?: string, to?: string): Promise<FiscalReceiptDTO[]>;
  getReceiptById(token: string, id: string): Promise<FiscalReceiptDTO>;
  getSalesTotal(token: string, period?: string): Promise<any>;
  getSalesTrend(token: string, period?: string): Promise<SalesTrendDTO[]>;
  getTop10(token: string, period?: string): Promise<TopPerfumeDTO[]>;
  getReports(token: string): Promise<AnalysisReportDTO[]>;
  getReportById(token: string, id: string): Promise<AnalysisReportDTO>;
  exportReport(token: string, reportId: string): Promise<Blob>;
}
