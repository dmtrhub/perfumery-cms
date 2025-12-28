import { Request, Response, Router } from "express";
import { IAuditService } from "../../Domain/services/IAuditService";
import { ILogerService } from "../../Domain/services/ILogerService";
import { CreateAuditLogDTO } from "../../Domain/DTOs/CreateAuditLogDTO";
import { QueryAuditLogsDTO } from "../../Domain/DTOs/QueryAuditLogsDTO";
import { validateCreateAuditLog, validateQueryAuditLogs } from "../validators/AuditValidator";

export class AuditController {
  private router: Router;
  private auditService: IAuditService;
  private readonly logerService: ILogerService;

  constructor(auditService: IAuditService, logerService: ILogerService) {
    this.router = Router();
    this.auditService = auditService;
    this.logerService = logerService;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post('/logs', this.createLog.bind(this));
    this.router.get('/logs', this.getLogs.bind(this));
    this.router.get('/logs/:id', this.getLogById.bind(this));
    this.router.get('/logs/service/:service', this.getLogsByService.bind(this));
    this.router.get('/logs/entity/:entityId', this.getLogsByEntity.bind(this));
    this.router.delete('/logs/cleanup/:days', this.deleteOldLogs.bind(this));
  }

  /**
   * POST /api/v1/logs
   * Creates a new audit log
   */
  private async createLog(req: Request, res: Response): Promise<void> {
  try {
    console.log(`\x1b[32m[AuditController]\x1b[0m === CREATE LOG REQUEST ===`);
    console.log(`\x1b[32m[AuditController]\x1b[0m Headers:`, req.headers);
    console.log(`\x1b[32m[AuditController]\x1b[0m Body:`, JSON.stringify(req.body, null, 2));
    console.log(`\x1b[32m[AuditController]\x1b[0m IP: ${req.ip}`);
    
    this.logerService.log("Create audit log request received");

    const data: CreateAuditLogDTO = req.body as CreateAuditLogDTO;
    
    console.log(`\x1b[32m[AuditController]\x1b[0m Parsed data:`, data);

    // Add request metadata
    if (!data.ipAddress) {
      data.ipAddress = req.ip;
    }
    
    if (!data.userAgent) {
      data.userAgent = req.get('User-Agent');
    }

    console.log(`\x1b[32m[AuditController]\x1b[0m After adding metadata:`, data);

    const validation = validateCreateAuditLog(data);
    console.log(`\x1b[32m[AuditController]\x1b[0m Validation result:`, validation);
    
    if (!validation.valid) {
      console.error(`\x1b[31m[AuditController]\x1b[0m Validation failed:`, validation.errors);
      res.status(400).json({ 
        success: false, 
        message: "Validation failed",
        errors: validation.errors 
      });
      return;
    }

    const log = await this.auditService.createLog(data);
    
    console.log(`\x1b[32m[AuditController]\x1b[0m Log created successfully:`, log.id);
    
    res.status(201).json({ 
      success: true, 
      message: "Audit log created successfully",
      data: log 
    });
  } catch (error: any) {
    console.error(`\x1b[31m[AuditController]\x1b[0m Error:`, error);
    this.logerService.log(`Error creating audit log: ${error}`);
    res.status(400).json({ 
      success: false, 
      message: error.message || "Failed to create audit log" 
    });
  }
}

  /**
   * GET /api/v1/logs
   * Gets audit logs with filtering
   */
  private async getLogs(req: Request, res: Response): Promise<void> {
    try {
      this.logerService.log("Get audit logs request received");

      const query: QueryAuditLogsDTO = {
        service: req.query.service as any,
        action: req.query.action as any,
        userId: req.query.userId ? parseInt(req.query.userId as string) : undefined,
        entityId: req.query.entityId as string,
        entityType: req.query.entityType as string,
        logLevel: req.query.logLevel as any,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 100
      };

      const validation = validateQueryAuditLogs(query);
      if (!validation.valid) {
        res.status(400).json({ 
          success: false, 
          message: "Validation failed",
          errors: validation.errors 
        });
        return;
      }

      const logs = await this.auditService.getLogs(query);
      
      res.status(200).json({ 
        success: true, 
        data: logs 
      });
    } catch (error: any) {
      this.logerService.log(`Error getting audit logs: ${error}`);
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to fetch audit logs" 
      });
    }
  }

  /**
   * GET /api/v1/logs/:id
   * Gets audit log by ID
   */
  private async getLogById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      this.logerService.log(`Get audit log by ID request received: ${id}`);

      if (isNaN(id) || id <= 0) {
        res.status(400).json({ 
          success: false, 
          message: "Invalid audit log ID" 
        });
        return;
      }

      const log = await this.auditService.getLogById(id);
      
      if (log) {
        res.status(200).json({ 
          success: true, 
          data: log 
        });
      } else {
        res.status(404).json({ 
          success: false, 
          message: "Audit log not found" 
        });
      }
    } catch (error: any) {
      this.logerService.log(`Error getting audit log by ID: ${error}`);
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to fetch audit log" 
      });
    }
  }

  /**
   * GET /api/v1/logs/service/:service
   * Gets audit logs by service
   */
  private async getLogsByService(req: Request, res: Response): Promise<void> {
    try {
      const service = req.params.service;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      
      this.logerService.log(`Get audit logs by service request received: ${service}`);

      const logs = await this.auditService.getLogsByService(service, limit);
      
      res.status(200).json({ 
        success: true, 
        data: logs 
      });
    } catch (error: any) {
      this.logerService.log(`Error getting audit logs by service: ${error}`);
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to fetch audit logs" 
      });
    }
  }

  /**
   * GET /api/v1/logs/entity/:entityId
   * Gets audit logs by entity
   */
  private async getLogsByEntity(req: Request, res: Response): Promise<void> {
    try {
      const entityId = req.params.entityId;
      const entityType = req.query.entityType as string;
      
      this.logerService.log(`Get audit logs by entity request received: ${entityId}${entityType ? ` (${entityType})` : ''}`);

      const logs = await this.auditService.getLogsByEntity(entityId, entityType);
      
      res.status(200).json({ 
        success: true, 
        data: logs 
      });
    } catch (error: any) {
      this.logerService.log(`Error getting audit logs by entity: ${error}`);
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to fetch audit logs" 
      });
    }
  }

  /**
   * DELETE /api/v1/logs/cleanup/:days
   * Deletes old audit logs
   */
  private async deleteOldLogs(req: Request, res: Response): Promise<void> {
    try {
      const days = parseInt(req.params.days);
      this.logerService.log(`Delete old audit logs request received: older than ${days} days`);

      if (isNaN(days) || days < 1) {
        res.status(400).json({ 
          success: false, 
          message: "Invalid number of days" 
        });
        return;
      }

      const deletedCount = await this.auditService.deleteOldLogs(days);
      
      res.status(200).json({ 
        success: true, 
        message: `Deleted ${deletedCount} audit logs older than ${days} days`,
        data: { deletedCount }
      });
    } catch (error: any) {
      this.logerService.log(`Error deleting old audit logs: ${error}`);
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to delete old audit logs" 
      });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}

export default AuditController;