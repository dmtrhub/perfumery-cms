import { AuditLogDTO } from "../../models/audit/AuditDTO";

export interface IAuditAPI {
  getAllLogs(token: string, type?: string, serviceName?: string): Promise<AuditLogDTO[]>;
  getLogById(token: string, id: string): Promise<AuditLogDTO>;
  deleteLog(token: string, id: string): Promise<any>;
}
