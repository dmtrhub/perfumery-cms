import { IsEnum, IsNotEmpty, IsString, IsUUID, IsOptional, MaxLength } from "class-validator";
import { Transform } from "class-transformer";
import { AuditLogType } from "../enums/AuditLogType";
import { ServiceType } from "../enums/ServiceType";

export class CreateAuditLogDTO {
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toUpperCase();
    }
    return value;
  })
  @IsEnum(AuditLogType, { message: "Type must be one of: INFO, WARNING, ERROR" })
  @IsNotEmpty({ message: "Type is required" })
  type!: AuditLogType;

  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value.toUpperCase();
    }
    return value;
  })
  @IsEnum(ServiceType, { message: "Service name must be a valid ServiceType" })
  @IsNotEmpty({ message: "Service name is required" })
  serviceName!: ServiceType;

  @IsString()
  @IsNotEmpty({ message: "Description is required" })
  @MaxLength(500, { message: "Description must not exceed 500 characters" })
  description!: string;

  @IsUUID()
  @IsOptional()
  userId?: string;

  @IsString()
  @IsOptional()
  @MaxLength(45, { message: "IP address must not exceed 45 characters" })
  ipAddress?: string;
}