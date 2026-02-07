import { Router, Request, Response } from "express";
import { Repository } from "typeorm";
import { PerformanceReport } from "../../Domain/models/PerformanceReport";
import { PerformanceCoordinator } from "../../Services/PerformanceCoordinator";
import { AuditClient } from "../../External/AuditClient";
import { Logger } from "../../Infrastructure/Logger";
import { ValidatorMiddleware } from "../../Middlewares/ValidatorMiddleware";
import { RunSimulationDTO } from "../../Domain/DTOs/RunSimulationDTO";

export class PerformanceController {
  private coordinator: PerformanceCoordinator;
  private logger: Logger;
  private router: Router;

  constructor(
    private reportRepository: Repository<PerformanceReport>,
    private auditClient: AuditClient
  ) {
    this.coordinator = new PerformanceCoordinator(reportRepository, auditClient);
    this.logger = Logger.getInstance();
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // POST /api/v1/performance/simulate - Pokreni simulaciju
    this.router.post(
      "/simulate",
      ValidatorMiddleware(RunSimulationDTO),
      this.runSimulation.bind(this)
    );

    // GET /api/v1/performance/reports - Lista izveštaja
    this.router.get("/reports", this.getReports.bind(this));

    // GET /api/v1/performance/reports/:id - Detalji izveštaja
    this.router.get("/reports/:id", this.getReportById.bind(this));

    // POST /api/v1/performance/reports/export - Izvoz u PDF
    this.router.post("/reports/export", this.exportReportToPdf.bind(this));
  }

  public getRouter(): Router {
    return this.router;
  }

  private async runSimulation(req: Request, res: Response): Promise<void> {
    try {
      const dto: RunSimulationDTO = req.body;

      const report = await this.coordinator.runSimulation(dto);

      this.logger.info("PerformanceController", `Simulation completed: ${report.id}`);

      res.status(201).json({
        success: true,
        data: report,
        message: "Simulacija uspešno pokrenuta"
      });
    } catch (error) {
      this.logger.error("PerformanceController", `Error running simulation: ${error}`);
      throw error;
    }
  }

  private async getReports(req: Request, res: Response): Promise<void> {
    try {
      const reports = await this.coordinator.getReports();

      this.logger.info("PerformanceController", `Fetched ${reports.length} reports`);

      res.status(200).json({
        success: true,
        data: reports,
        count: reports.length
      });
    } catch (error) {
      this.logger.error("PerformanceController", `Error fetching reports: ${error}`);
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

      this.logger.info("PerformanceController", `Fetched report: ${id}`);

      res.status(200).json({
        success: true,
        data: report
      });
    } catch (error) {
      this.logger.error("PerformanceController", `Error fetching report ${req.params.id}: ${error}`);
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

      const pdfBuffer = await this.coordinator.exportReportToPdf(reportId);

      this.logger.info("PerformanceController", `Exported report to PDF: ${reportId}`);

      res.status(200)
        .setHeader("Content-Type", "application/pdf")
        .setHeader("Content-Disposition", `attachment; filename="report-${reportId}.pdf"`)
        .send(pdfBuffer);
    } catch (error) {
      this.logger.error("PerformanceController", `Error exporting report to PDF: ${error}`);
      throw error;
    }
  }


}