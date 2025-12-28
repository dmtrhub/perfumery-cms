import { CreateAuditLogDTO } from "../../Domain/DTOs/CreateAuditLogDTO";
import { QueryAuditLogsDTO } from "../../Domain/DTOs/QueryAuditLogsDTO";
import { ServiceType } from "../../Domain/enums/ServiceType";
import { AuditAction } from "../../Domain/enums/AuditAction";
import { LogLevel } from "../../Domain/enums/LogLevel";

export function validateCreateAuditLog(data: CreateAuditLogDTO): { 
  valid: boolean; 
  errors?: string[] 
} {
  const errors: string[] = [];

  if (!data.service || !Object.values(ServiceType).includes(data.service)) {
    errors.push("Valid service type is required");
  }

  if (!data.action || !Object.values(AuditAction).includes(data.action)) {
    errors.push("Valid action is required");
  }

  if (!data.message || data.message.trim().length === 0) {
    errors.push("Message is required");
  }

  if (data.message.length > 1000) {
    errors.push("Message cannot exceed 1000 characters");
  }

  if (data.logLevel && !Object.values(LogLevel).includes(data.logLevel)) {
    errors.push("Valid log level is required");
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}

export function validateQueryAuditLogs(data: QueryAuditLogsDTO): { 
  valid: boolean; 
  errors?: string[] 
} {
  const errors: string[] = [];

  if (data.service && !Object.values(ServiceType).includes(data.service)) {
    errors.push("Invalid service type");
  }

  if (data.action && !Object.values(AuditAction).includes(data.action)) {
    errors.push("Invalid action");
  }

  if (data.logLevel && !Object.values(LogLevel).includes(data.logLevel)) {
    errors.push("Invalid log level");
  }

  if (data.page && data.page < 1) {
    errors.push("Page must be greater than 0");
  }

  if (data.limit && (data.limit < 1 || data.limit > 1000)) {
    errors.push("Limit must be between 1 and 1000");
  }

  if (data.startDate && isNaN(data.startDate.getTime())) {
    errors.push("Invalid start date");
  }

  if (data.endDate && isNaN(data.endDate.getTime())) {
    errors.push("Invalid end date");
  }

  if (data.startDate && data.endDate && data.startDate > data.endDate) {
    errors.push("Start date cannot be after end date");
  }

  return {
    valid: errors.length === 0,
    errors: errors.length > 0 ? errors : undefined
  };
}