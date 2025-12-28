import { LogLevel } from "../enums/LogLevel";
import { AuditAction } from "../enums/AuditAction";
import { ServiceType } from "../enums/ServiceType";

export interface CreateAuditLogDTO {
  service: ServiceType;
  action: AuditAction;
  userId?: number;
  userEmail?: string;
  entityId?: string;
  entityType?: string;
  logLevel?: LogLevel;
  message: string;
  details?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  successful?: boolean;
  source?: string;
}