import { Repository, MoreThanOrEqual, LessThanOrEqual, Like, FindOptionsWhere } from "typeorm";
import { AuditLog } from "../Domain/models/AuditLog";
import { LogLevel } from "../Domain/enums/LogLevel";
import { AuditAction } from "../Domain/enums/AuditAction";
import { ServiceType } from "../Domain/enums/ServiceType";
import { IAuditService } from "../Domain/services/IAuditService";
import { AuditLogDTO } from "../Domain/DTOs/AuditLogDTO";
import { CreateAuditLogDTO } from "../Domain/DTOs/CreateAuditLogDTO";
import { QueryAuditLogsDTO } from "../Domain/DTOs/QueryAuditLogsDTO";

export class AuditService implements IAuditService {
  constructor(private auditLogRepository: Repository<AuditLog>) {
    console.log("\x1b[35m[AuditService@1.0.0]\x1b[0m Service started");
  }

  async createLog(data: CreateAuditLogDTO): Promise<AuditLogDTO> {
    try {
      console.log(`\x1b[35m[AuditService]\x1b[0m Creating audit log: ${data.service}.${data.action}`);

      const newLog = new AuditLog();
      newLog.service = data.service;
      newLog.action = data.action;
      newLog.userId = data.userId;
      newLog.userEmail = data.userEmail;
      newLog.entityId = data.entityId;
      newLog.entityType = data.entityType;
      newLog.logLevel = data.logLevel || LogLevel.INFO;
      newLog.message = data.message;
      newLog.details = data.details;
      newLog.ipAddress = data.ipAddress;
      newLog.userAgent = data.userAgent;
      newLog.successful = data.successful !== undefined ? data.successful : true;
      newLog.source = data.source;

      const savedLog = await this.auditLogRepository.save(newLog);

      // Log the audit event itself
      console.log(`\x1b[32m[AuditService]\x1b[0m Audit log created: ${savedLog.id} - ${savedLog.service}.${savedLog.action}`);

      return this.toAuditLogDTO(savedLog);
    } catch (error) {
      console.error(`\x1b[31m[AuditService]\x1b[0m Failed to create audit log:`, error);
      throw new Error(`Failed to create audit log: ${error}`);
    }
  }

  async getLogs(query: QueryAuditLogsDTO): Promise<AuditLogDTO[]> {
    console.log("\x1b[35m[AuditService]\x1b[0m Getting audit logs with query");
    
    const where: FindOptionsWhere<AuditLog> = {};
    
    if (query.service) where.service = query.service;
    if (query.action) where.action = query.action;
    if (query.userId) where.userId = query.userId;
    if (query.entityId) where.entityId = query.entityId;
    if (query.entityType) where.entityType = query.entityType;
    if (query.logLevel) where.logLevel = query.logLevel;
    
    const logs = await this.auditLogRepository.find({
      where,
      order: { timestamp: "DESC" },
      take: query.limit || 100,
      skip: query.page ? (query.page - 1) * (query.limit || 100) : 0
    });
    
    return logs.map(log => this.toAuditLogDTO(log));
  }

  async getLogById(id: number): Promise<AuditLogDTO | null> {
    console.log(`\x1b[35m[AuditService]\x1b[0m Getting audit log by ID: ${id}`);
    
    const log = await this.auditLogRepository.findOne({ where: { id } });
    return log ? this.toAuditLogDTO(log) : null;
  }

  async getLogsByService(service: string, limit: number = 100): Promise<AuditLogDTO[]> {
    console.log(`\x1b[35m[AuditService]\x1b[0m Getting logs for service: ${service}`);
    
    const logs = await this.auditLogRepository.find({
      where: { service: service as ServiceType },
      order: { timestamp: "DESC" },
      take: limit
    });
    
    return logs.map(log => this.toAuditLogDTO(log));
  }

  async getLogsByEntity(entityId: string, entityType?: string): Promise<AuditLogDTO[]> {
    console.log(`\x1b[35m[AuditService]\x1b[0m Getting logs for entity: ${entityId}${entityType ? ` (${entityType})` : ''}`);
    
    const where: FindOptionsWhere<AuditLog> = { entityId };
    if (entityType) where.entityType = entityType;
    
    const logs = await this.auditLogRepository.find({
      where,
      order: { timestamp: "DESC" }
    });
    
    return logs.map(log => this.toAuditLogDTO(log));
  }

  async deleteOldLogs(days: number): Promise<number> {
    console.log(`\x1b[35m[AuditService]\x1b[0m Deleting logs older than ${days} days`);
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    const result = await this.auditLogRepository.createQueryBuilder()
      .delete()
      .from(AuditLog)
      .where("timestamp < :cutoffDate", { cutoffDate })
      .execute();
    
    const deletedCount = result.affected || 0;
    console.log(`\x1b[32m[AuditService]\x1b[0m Deleted ${deletedCount} old audit logs`);
    
    return deletedCount;
  }

  async logSystemEvent(service: ServiceType, message: string, details?: any): Promise<AuditLogDTO> {
    return this.createLog({
      service,
      action: AuditAction.SYSTEM_EVENT,
      logLevel: LogLevel.INFO,
      message,
      details,
      source: "SYSTEM"
    });
  }

  async logErrorEvent(service: ServiceType, error: Error, context?: any): Promise<AuditLogDTO> {
    return this.createLog({
      service,
      action: AuditAction.SYSTEM_EVENT,
      logLevel: LogLevel.ERROR,
      message: error.message,
      details: {
        error: error.stack,
        context
      },
      source: "SYSTEM"
    });
  }

  private toAuditLogDTO(log: AuditLog): AuditLogDTO {
    return {
      id: log.id,
      service: log.service,
      action: log.action,
      userId: log.userId,
      userEmail: log.userEmail,
      entityId: log.entityId,
      entityType: log.entityType,
      logLevel: log.logLevel,
      message: log.message,
      details: log.details,
      ipAddress: log.ipAddress,
      userAgent: log.userAgent,
      timestamp: log.timestamp,
      createdAt: log.createdAt,
      successful: log.successful,
      source: log.source
    };
  }
}