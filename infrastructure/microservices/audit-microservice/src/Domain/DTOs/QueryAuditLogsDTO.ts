import { LogLevel } from "../enums/LogLevel";
import { AuditAction } from "../enums/AuditAction";
import { ServiceType } from "../enums/ServiceType";

export interface QueryAuditLogsDTO {
  service?: ServiceType;
  action?: AuditAction;
  userId?: number;
  entityId?: string;
  entityType?: string;
  logLevel?: LogLevel;
  startDate?: Date;
  endDate?: Date;
  search?: string;
  page?: number;
  limit?: number;
}