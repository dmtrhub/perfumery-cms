import { AuditLogType } from "../../enums/AuditLogType";
import { ServiceType } from "../../enums/ServiceType";

export interface AuditLogDTO {
  id: string;
  type: AuditLogType;
  serviceName: ServiceType;
  description: string;
  userId?: string;
  ipAddress?: string;
  timestamp: string;
}

export interface CreateAuditLogDTO {
  type: AuditLogType;
  serviceName: ServiceType;
  description: string;
  userId?: string;
  ipAddress?: string;
}
