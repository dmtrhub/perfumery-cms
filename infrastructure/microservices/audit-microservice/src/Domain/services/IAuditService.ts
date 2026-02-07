import { AuditLog } from "../models/AuditLog";
import { CreateAuditLogDTO } from "../DTOs/CreateAuditLogDTO";
import { FilterAuditLogsDTO } from "../DTOs/FilterAuditLogsDTO";

export interface IAuditService {
  createAuditLog(dto: CreateAuditLogDTO): Promise<AuditLog>;
  getAuditLogById(id: string): Promise<AuditLog>;
  getAllAuditLogs(filters?: FilterAuditLogsDTO): Promise<AuditLog[]>;
  deleteAuditLog(id: string): Promise<void>;
}