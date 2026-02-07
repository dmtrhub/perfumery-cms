import { Router, Request, Response } from "express";
import { Repository } from "typeorm";
import { AuditLog } from "../../Domain/models/AuditLog";
import { AuditService } from "../../Services/AuditService";
import { asyncHandler } from "../../Infrastructure/asyncHandler";
import { ValidatorMiddleware } from "../../Middlewares/ValidatorMiddleware";
import { CreateAuditLogDTO } from "../../Domain/DTOs/CreateAuditLogDTO";
import { FilterAuditLogsDTO } from "../../Domain/DTOs/FilterAuditLogsDTO";
import { Logger } from "../../Infrastructure/Logger";

export class AuditController {
  private router: Router;
  private readonly auditService: AuditService;
  private readonly logger: Logger;

  constructor(auditRepository: Repository<AuditLog>) {
    this.router = Router();
    this.auditService = new AuditService(auditRepository);
    this.logger = Logger.getInstance();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post(
      "/logs",
      ValidatorMiddleware(CreateAuditLogDTO),
      asyncHandler(this.createAuditLog.bind(this))
    );

    this.router.get(
      "/logs",
      asyncHandler(this.getAllAuditLogs.bind(this))
    );

    this.router.get(
      "/logs/:id",
      asyncHandler(this.getAuditLogById.bind(this))
    );

    this.router.delete(
      "/logs/:id",
      asyncHandler(this.deleteAuditLog.bind(this))
    );
  }

  private async createAuditLog(req: Request, res: Response): Promise<void> {
    const dto = req.body as CreateAuditLogDTO;
    
    this.logger.info("AuditController", `Received audit log request: ${JSON.stringify(dto)}`);
    
    const auditLog = await this.auditService.createAuditLog(dto);

    res.status(201).json({
      success: true,
      code: "AUDIT_LOG_CREATED",
      data: auditLog.toJSON(),
      timestamp: new Date().toISOString()
    });
  }

  private async getAllAuditLogs(req: Request, res: Response): Promise<void> {
    const filters: FilterAuditLogsDTO = {
      type: req.query.type as any,
      serviceName: req.query.serviceName as any,
      fromDate: req.query.fromDate as string,
      toDate: req.query.toDate as string
    };

    const auditLogs = await this.auditService.getAllAuditLogs(filters);

    res.status(200).json({
      success: true,
      code: "AUDIT_LOGS_RETRIEVED",
      data: auditLogs.map(log => log.toJSON()),
      count: auditLogs.length,
      timestamp: new Date().toISOString()
    });
  }

  private async getAuditLogById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    const auditLog = await this.auditService.getAuditLogById(id);

    res.status(200).json({
      success: true,
      code: "AUDIT_LOG_RETRIEVED",
      data: auditLog.toJSON(),
      timestamp: new Date().toISOString()
    });
  }

  private async deleteAuditLog(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    await this.auditService.deleteAuditLog(id);

    res.status(200).json({
      success: true,
      code: "AUDIT_LOG_DELETED",
      message: `Audit log ${id} successfully deleted`,
      timestamp: new Date().toISOString()
    });
  }

  getRouter(): Router {
    return this.router;
  }
}