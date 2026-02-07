import { IsEnum, IsOptional, IsDateString } from "class-validator";
import { AuditLogType } from "../enums/AuditLogType";
import { ServiceType } from "../enums/ServiceType";

export class FilterAuditLogsDTO {
  @IsEnum(AuditLogType)
  @IsOptional()
  type?: AuditLogType;

  @IsEnum(ServiceType)
  @IsOptional()
  serviceName?: ServiceType;

  @IsDateString()
  @IsOptional()
  fromDate?: string;

  @IsDateString()
  @IsOptional()
  toDate?: string;
}