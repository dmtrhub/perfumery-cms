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
  search?: string; // search by message or details
  successful?: boolean;
  source?: string;
  page?: number; // default: 1
  limit?: number; // default: 100
  sortBy?: "timestamp" | "service" | "logLevel" | "userId";
  sortOrder?: "ASC" | "DESC";
}