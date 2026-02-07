import { AuditLogType } from "../enums/AuditLogType";
import { ServiceType } from "../enums/ServiceType";

export class AuditLogDTO {
  id!: string;
  type!: AuditLogType;
  serviceName!: ServiceType;
  description!: string;
  userId?: string;
  ipAddress?: string;
  timestamp!: Date;
}