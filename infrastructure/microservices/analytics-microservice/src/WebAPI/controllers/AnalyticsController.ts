import { Router, Request, Response } from "express";
import { Repository } from "typeorm";
import { FiscalReceipt } from "../../Domain/models/FiscalReceipt";
import { AnalysisReport } from "../../Domain/models/AnalysisReport";
import { AnalyticsCoordinator } from "../../Services/AnalyticsCoordinator";
import { AuditClient } from "../../External/AuditClient";
import { Logger } from "../../Infrastructure/Logger";
import { ValidatorMiddleware } from "../../Middlewares/ValidatorMiddleware";
import { CreateFiscalReceiptDTO } from "../../Domain/DTOs/CreateFiscalReceiptDTO";

export class AnalyticsController {
  private coordinator: AnalyticsCoordinator;
  private logger: Logger;
  private router: Router;

  constructor(
    private fiscalReceiptRepository: Repository<FiscalReceipt>,
    private analysisReportRepository: Repository<AnalysisReport>,
    private auditClient: AuditClient
  ) {
    this.coordinator = new AnalyticsCoordinator(
      fiscalReceiptRepository,
      analysisReportRepository,
      auditClient
    );
    this.logger = Logger.getInstance();
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // POST /api/v1/analytics/receipts - Create fiscal receipt
    this.router.post(
      "/receipts",
      ValidatorMiddleware(CreateFiscalReceiptDTO),
      this.createFiscalReceipt.bind(this)
    );

    // GET /api/v1/analytics/receipts - Get all receipts with optional date filtering
    this.router.get("/receipts", this.getFiscalReceipts.bind(this));

    // VAŽNO: Sales rute trebale biti PRIJE :id parametra jer su specifičnije!
    // GET /api/v1/analytics/sales/total - Get total sales with optional period filtering
    this.router.get("/sales/total", this.getTotalSales.bind(this));

    // GET /api/v1/analytics/sales/trend - Get sales trend
    this.router.get("/sales/trend", this.getSalesTrend.bind(this));

    // GET /api/v1/analytics/sales/top10 - Get top 10 perfumes by sales
    this.router.get("/sales/top10", this.getTop10Perfumes.bind(this));

    // GET /api/v1/analytics/receipts/:id - Get receipt by ID (MORA biti nakon specifičnijih ruta!)
    this.router.get("/receipts/:id", this.getFiscalReceiptById.bind(this));

    // GET /api/v1/analytics/reports - Get all reports
    this.router.get("/reports", this.getAllReports.bind(this));

    // GET /api/v1/analytics/reports/:id - Get report by ID
    this.router.get("/reports/:id", this.getReportById.bind(this));

    // POST /api/v1/analytics/reports/export - Export report to PDF
    this.router.post("/reports/export", this.exportReportToPdf.bind(this));
  }

  public getRouter(): Router {
    return this.router;
  }

  private async createFiscalReceipt(req: Request, res: Response): Promise<void> {
    try {
      const dto: CreateFiscalReceiptDTO = req.body;

      const receipt = await this.coordinator.createFiscalReceipt(dto);

      this.logger.info("AnalyticsController", `Fiscal receipt created: ${receipt.id}`);

      res.status(201).json({
        success: true,
        data: receipt,
        message: "Fiskalni račun uspešno kreiran"
      });
    } catch (error) {
      this.logger.error("AnalyticsController", `Error creating fiscal receipt: ${error}`);
      throw error;
    }
  }

  private async getFiscalReceipts(req: Request, res: Response): Promise<void> {
    try {
      const from = req.query.from as string;
      const to = req.query.to as string;

      const fromDate = from ? new Date(from) : undefined;
      const toDate = to ? new Date(to) : undefined;

      const receipts = await this.coordinator.getFiscalReceipts(fromDate, toDate);

      this.logger.info("AnalyticsController", `Fetched ${receipts.length} fiscal receipts`);

      res.status(200).json({
        success: true,
        data: receipts,
        count: receipts.length
      });
    } catch (error) {
      this.logger.error("AnalyticsController", `Error fetching fiscal receipts: ${error}`);
      throw error;
    }
  }

  private async getFiscalReceiptById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;

      const receipt = await this.coordinator.getFiscalReceiptById(id);

      if (!receipt) {
        res.status(404).json({
          success: false,
          message: "Fiskalni račun nije pronađen"
        });
        return;
      }

      this.logger.info("AnalyticsController", `Fetched fiscal receipt: ${id}`);

      res.status(200).json({
        success: true,
        data: receipt
      });
    } catch (error) {
      this.logger.error("AnalyticsController", `Error fetching fiscal receipt ${req.params.id}: ${error}`);
      throw error;
    }
  }

  private async getTotalSales(req: Request, res: Response): Promise<void> {
    try {
      const period = req.query.period as string;

      const report = await this.coordinator.generateReport(period as "year" | "day" | "week" | "month" | "total" | undefined);

      this.logger.info("AnalyticsController", `Generated total sales report for period: ${period || "total"}`);

      res.status(200).json({
        success: true,
        data: report.data,
        reportId: report.id
      });
    } catch (error) {
      this.logger.error("AnalyticsController", `Error getting total sales: ${error}`);
      throw error;
    }
  }

  private async getSalesTrend(req: Request, res: Response): Promise<void> {
    try {
      const period = req.query.period as string;

      // Calculate date range based on period
      const now = new Date();
      let from: Date | undefined;
      let to = now;

      switch (period) {
        case "day":
          from = new Date(now);
          from.setHours(0, 0, 0, 0);
          break;
        case "week":
          from = new Date(now);
          from.setDate(now.getDate() - now.getDay());
          break;
        case "month":
          from = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "year":
          from = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          from = undefined;
      }

      const receipts = from ?
        await this.coordinator.getFiscalReceipts(from, to) :
        await this.coordinator.getFiscalReceipts();

      // Group receipts by date and calculate daily totals
      const trendData = new Map<string, { total: number; count: number }>();

      receipts.forEach(receipt => {
        const date = new Date(receipt.createdAt).toISOString().split("T")[0];
        const existing = trendData.get(date) || { total: 0, count: 0 };
        existing.total += receipt.totalAmount as any;
        existing.count += 1;
        trendData.set(date, existing);
      });

      const trend = Array.from(trendData.entries()).map(([date, data]) => ({
        date,
        totalAmount: data.total,
        receiptsCount: data.count
      }));

      this.logger.info("AnalyticsController", `Generated sales trend with ${trend.length} data points`);

      res.status(200).json({
        success: true,
        data: trend
      });
    } catch (error) {
      this.logger.error("AnalyticsController", `Error getting sales trend: ${error}`);
      throw error;
    }
  }

  private async getTop10Perfumes(req: Request, res: Response): Promise<void> {
    try {
      const period = req.query.period as string;

      // Calculate date range based on period
      const now = new Date();
      let from: Date | undefined;
      let to = now;

      switch (period) {
        case "day":
          from = new Date(now);
          from.setHours(0, 0, 0, 0);
          break;
        case "week":
          from = new Date(now);
          from.setDate(now.getDate() - now.getDay());
          break;
        case "month":
          from = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case "year":
          from = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          from = undefined;
      }

      const receipts = from ?
        await this.coordinator.getFiscalReceipts(from, to) :
        await this.coordinator.getFiscalReceipts();

      const perfumeTotals = new Map<string, { quantity: number; revenue: number }>();

      receipts.forEach(receipt => {
        receipt.items.forEach(item => {
          if (item.perfumeId) {
            const existing = perfumeTotals.get(item.perfumeId) || { quantity: 0, revenue: 0 };
            existing.quantity += item.quantity;
            existing.revenue += item.price * item.quantity;
            perfumeTotals.set(item.perfumeId, existing);
          }
        });
      });

      const top10 = Array.from(perfumeTotals.entries())
        .map(([perfumeId, data]) => ({
          perfumeId,
          ...data
        }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);

      this.logger.info("AnalyticsController", `Generated top 10 perfumes`);

      res.status(200).json({
        success: true,
        data: top10
      });
    } catch (error) {
      this.logger.error("AnalyticsController", `Error getting top 10 perfumes: ${error}`);
      throw error;
    }
  }

  private async getAllReports(req: Request, res: Response): Promise<void> {
    try {
      const reports = await this.coordinator.getReports();

      this.logger.info("AnalyticsController", `Fetched ${reports.length} reports`);

      res.status(200).json({
        success: true,
        data: reports,
        count: reports.length
      });
    } catch (error) {
      this.logger.error("AnalyticsController", `Error fetching reports: ${error}`);
      throw error;
    }
  }

  private async getReportById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;

      const report = await this.coordinator.getReportById(id);

      if (!report) {
        res.status(404).json({
          success: false,
          message: "Izveštaj nije pronađen"
        });
        return;
      }

      this.logger.info("AnalyticsController", `Fetched report: ${id}`);

      res.status(200).json({
        success: true,
        data: report
      });
    } catch (error) {
      this.logger.error("AnalyticsController", `Error fetching report ${req.params.id}: ${error}`);
      throw error;
    }
  }

  private async exportReportToPdf(req: Request, res: Response): Promise<void> {
    try {
      const { reportId } = req.body;

      if (!reportId) {
        res.status(400).json({
          success: false,
          message: "reportId je obavezno"
        });
        return;
      }

      this.logger.info("AnalyticsController", `🚀 Starting PDF export for reportId: ${reportId}`);

      const pdfBuffer = await this.coordinator.exportReportToPdf(reportId);

      this.logger.info("AnalyticsController", `✅ PDF buffer received, size: ${pdfBuffer.length} bytes`);
      this.logger.info("AnalyticsController", `🔍 Buffer type: ${typeof pdfBuffer}, is Buffer: ${Buffer.isBuffer(pdfBuffer)}`);
      this.logger.info("AnalyticsController", `🔍 First 10 bytes: ${pdfBuffer.slice(0, 10).toString('hex')}`);

      // Prvo setuj headers, pa onda send buffer
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="report-${reportId}.pdf"`);
      res.setHeader("Content-Length", pdfBuffer.length);

      this.logger.info("AnalyticsController", `📤 Headers set, about to send buffer...`);

      // Koristi .end() sa Buffer-om umjesto .send() za sigurnost
      res.end(pdfBuffer, () => {
        this.logger.info("AnalyticsController", `✅ PDF successfully sent to client: ${reportId}`);
      });
      
    } catch (error) {
      this.logger.error("AnalyticsController", `❌ Error exporting report to PDF: ${error}`);
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          message: "Failed to export PDF"
        });
      }
    }
  }
}