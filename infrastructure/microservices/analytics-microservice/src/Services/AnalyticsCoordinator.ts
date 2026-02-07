import { Repository } from "typeorm";
import { FiscalReceipt } from "../Domain/models/FiscalReceipt";
import { AnalysisReport } from "../Domain/models/AnalysisReport";
import { CreateFiscalReceiptDTO } from "../Domain/DTOs/CreateFiscalReceiptDTO";
import { Logger } from "../Infrastructure/Logger";
import { AuditClient } from "../External/AuditClient";
import { ResourceNotFoundException } from "../Domain/exceptions/ResourceNotFoundException";
import { PdfGeneratorService } from "./PdfGeneratorService";

export class AnalyticsCoordinator {
  private readonly logger: Logger;
  private readonly pdfGenerator: PdfGeneratorService;

  constructor(
    private fiscalReceiptRepository: Repository<FiscalReceipt>,
    private analysisReportRepository: Repository<AnalysisReport>,
    private auditClient: AuditClient
  ) {
    this.logger = Logger.getInstance();
    this.pdfGenerator = new PdfGeneratorService(auditClient);
  }

  // Create fiscal receipt
  async createFiscalReceipt(dto: CreateFiscalReceiptDTO): Promise<FiscalReceipt> {
    try {
      this.logger.info("AnalyticsCoordinator", `Creating fiscal receipt: ${dto.totalAmount}`);

      const receipt = this.fiscalReceiptRepository.create({
        saleType: dto.saleType,
        paymentMethod: dto.paymentMethod,
        items: dto.items,
        totalAmount: dto.totalAmount,
        userId: dto.userId,
        username: dto.username
      });

      const saved = await this.fiscalReceiptRepository.save(receipt);

      await this.auditClient.logInfo("ANALYTICS", `Fiscal receipt created: ${saved.id} by ${saved.username}`);

      this.logger.info("AnalyticsCoordinator", `Fiscal receipt created: ${saved.id}`);

      return saved;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error("AnalyticsCoordinator", `Failed to create fiscal receipt: ${message}`);
      await this.auditClient.logError("ANALYTICS", `Failed to create fiscal receipt: ${message}`);
      throw error;
    }
  }

  // Get fiscal receipts
  async getFiscalReceipts(from?: Date, to?: Date): Promise<FiscalReceipt[]> {
    try {
      this.logger.info("AnalyticsCoordinator", `Fetching fiscal receipts`);

      let query = this.fiscalReceiptRepository.createQueryBuilder("receipt");

      if (from && to) {
        query = query.where("receipt.createdAt BETWEEN :from AND :to", { from, to });
      }

      const receipts = await query.orderBy("receipt.createdAt", "DESC").getMany();

      this.logger.info("AnalyticsCoordinator", `✅ Fetched ${receipts.length} receipts`);

      return receipts;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error("AnalyticsCoordinator", `❌ Failed to fetch receipts: ${message}`);
      await this.auditClient.logError("ANALYTICS", `Failed to fetch receipts: ${message}`);
      throw error;
    }
  }

  // Get fiscal receipt by ID
  async getFiscalReceiptById(id: string): Promise<FiscalReceipt> {
    try {
      const receipt = await this.fiscalReceiptRepository.findOne({ where: { id } });

      if (!receipt) {
        throw new ResourceNotFoundException(`Fiscal receipt with ID ${id} not found`);
      }

      return receipt;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error("AnalyticsCoordinator", `❌ Failed to fetch receipt: ${message}`);
      throw error;
    }
  }

  // Generate report
  async generateReport(period?: "day" | "week" | "month" | "year" | "total"): Promise<AnalysisReport> {
    try {
      this.logger.info("AnalyticsCoordinator", `Generating report for period: ${period || "total"}`);

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
        await this.getFiscalReceipts(from, to) :
        await this.fiscalReceiptRepository.find();

      const data = this.calculateAnalytics(receipts, period);

      const report = this.analysisReportRepository.create({
        reportType: `Sales Analysis - ${period || "Total"}`,
        data
      });

      const saved = await this.analysisReportRepository.save(report);

      await this.auditClient.logInfo("ANALYTICS", `Report generated: ${saved.id}`);

      this.logger.info("AnalyticsCoordinator", `✅ Report generated: ${saved.id}`);

      return saved;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error("AnalyticsCoordinator", `❌ Failed to generate report: ${message}`);
      await this.auditClient.logError("ANALYTICS", `Failed to generate report: ${message}`);
      throw error;
    }
  }

  // Get all reports
  async getReports(): Promise<AnalysisReport[]> {
    try {
      this.logger.info("AnalyticsCoordinator", `Fetching analysis reports`);

      const reports = await this.analysisReportRepository.find({
        order: { createdAt: "DESC" }
      });

      this.logger.info("AnalyticsCoordinator", `✅ Fetched ${reports.length} reports`);

      return reports;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error("AnalyticsCoordinator", `❌ Failed to fetch reports: ${message}`);
      await this.auditClient.logError("ANALYTICS", `Failed to fetch reports: ${message}`);
      throw error;
    }
  }

  // Get report by ID
  async getReportById(id: string): Promise<AnalysisReport> {
    try {
      const report = await this.analysisReportRepository.findOne({ where: { id } });

      if (!report) {
        throw new ResourceNotFoundException(`Report with ID ${id} not found`);
      }

      return report;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error("AnalyticsCoordinator", `❌ Failed to fetch report: ${message}`);
      throw error;
    }
  }

  // Calculate analytics
  private calculateAnalytics(
    receipts: FiscalReceipt[],
    period?: "day" | "week" | "month" | "year" | "total"
  ): Record<string, any> {
    const totalRevenue = receipts.reduce((sum, r) => sum + parseFloat(r.totalAmount.toString()), 0);
    const totalReceipts = receipts.length;
    const totalItemsSold = receipts.reduce((sum, r) => {
      return sum + r.items.reduce((itemSum, item) => itemSum + item.quantity, 0);
    }, 0);
    const averageOrderValue = totalReceipts > 0 ? totalRevenue / totalReceipts : 0;

    return {
      period: period || "total",
      totalRevenue,
      totalReceipts,
      totalItemsSold,
      averageOrderValue,
      saleTypeBreakdown: this.getSaleTypeBreakdown(receipts),
      paymentMethodBreakdown: this.getPaymentMethodBreakdown(receipts),
      topPerfumes: this.getTopPerfumes(receipts)
    };
  }

  private getSaleTypeBreakdown(receipts: FiscalReceipt[]): Record<string, number> {
    return receipts.reduce(
      (acc, r) => {
        acc[r.saleType] = (acc[r.saleType] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }

  private getPaymentMethodBreakdown(receipts: FiscalReceipt[]): Record<string, number> {
    return receipts.reduce(
      (acc, r) => {
        acc[r.paymentMethod] = (acc[r.paymentMethod] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>
    );
  }

  private getTopPerfumes(receipts: FiscalReceipt[]): Array<{ perfumeId: string; totalQuantity: number }> {
    const perfumeTotals = new Map<string, number>();

    receipts.forEach(receipt => {
      receipt.items.forEach(item => {
        if (item.perfumeId) {
          perfumeTotals.set(item.perfumeId, (perfumeTotals.get(item.perfumeId) || 0) + item.quantity);
        }
      });
    });

    return Array.from(perfumeTotals.entries())
      .map(([perfumeId, totalQuantity]) => ({ perfumeId, totalQuantity }))
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, 10);
  }

  // Export report to PDF
  async exportReportToPdf(reportId: string): Promise<Buffer> {
    try {
      this.logger.info("AnalyticsCoordinator", `Exporting report to PDF: ${reportId}`);

      const report = await this.analysisReportRepository.findOne({ where: { id: reportId } });

      if (!report) {
        throw new ResourceNotFoundException(`Report with ID ${reportId} not found`);
      }

      const pdfBuffer = await this.pdfGenerator.generateReportPdf(report);

      await this.auditClient.logInfo("ANALYTICS", `Report exported to PDF: ${reportId}`);

      this.logger.info("AnalyticsCoordinator", `✅ Report exported to PDF: ${reportId}`);

      return pdfBuffer;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error("AnalyticsCoordinator", `❌ Failed to export report: ${message}`);
      await this.auditClient.logError("ANALYTICS", `Failed to export report: ${message}`);
      throw error;
    }
  }
}

