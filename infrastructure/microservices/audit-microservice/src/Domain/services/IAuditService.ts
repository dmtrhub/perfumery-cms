import { CreateAuditLogDTO } from "../DTOs/CreateAuditLogDTO";
import { QueryAuditLogsDTO } from "../DTOs/QueryAuditLogsDTO";
import { AuditLogDTO } from "../DTOs/AuditLogDTO";
import { AuditLog } from "../models/AuditLog";

export interface IAuditService {
  createLog(data: CreateAuditLogDTO): Promise<AuditLogDTO>;
  getLogs(query: QueryAuditLogsDTO): Promise<AuditLogDTO[]>;
  getLogById(id: number): Promise<AuditLogDTO | null>;
  getLogsByService(service: string, limit?: number): Promise<AuditLogDTO[]>;
  getLogsByEntity(entityId: string, entityType?: string): Promise<AuditLogDTO[]>;
  deleteOldLogs(days: number): Promise<number>;
}