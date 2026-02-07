import axios, { AxiosInstance } from "axios";
import { IAuditClient } from "./IAuditClient";
import { Logger } from "../Infrastructure/Logger";

/**
 * AuditClient
 * Klijent za komunikaciju sa Audit mikroservisom
 */
export class AuditClient implements IAuditClient {
  private readonly logger: Logger;
  private readonly auditServiceUrl: string;
  private readonly axiosInstance: AxiosInstance;

  constructor() {
    this.logger = Logger.getInstance();
    this.auditServiceUrl = process.env.AUDIT_SERVICE_URL || "http://localhost:5003";
    this.axiosInstance = axios.create({
      baseURL: this.auditServiceUrl,
      timeout: 5000,
      headers: { "X-Service-Name": "STORAGE_SERVICE" }
    });
  }

  async logInfo(serviceName: string, description: string, userId?: string): Promise<void> {
    try {
      await this.axiosInstance.post("/api/v1/audit/logs", {
        type: "INFO",
        serviceName: "STORAGE",
        description,
        userId
      });
    } catch (error: any) {
      const message = error.response?.data?.message || error.response?.status || error.message || "Unknown error";
      this.logger.warn("AuditClient", `Failed to log INFO: ${message}`);
    }
  }

  async logWarning(serviceName: string, description: string, userId?: string): Promise<void> {
    try {
      await this.axiosInstance.post("/api/v1/audit/logs", {
        type: "WARNING",
        serviceName: "STORAGE",
        description,
        userId
      });
    } catch (error: any) {
      const message = error.response?.data?.message || error.response?.status || error.message || "Unknown error";
      this.logger.warn("AuditClient", `Failed to log WARNING: ${message}`);
    }
  }

  async logError(serviceName: string, description: string, userId?: string): Promise<void> {
    try {
      await this.axiosInstance.post("/api/v1/audit/logs", {
        type: "ERROR",
        serviceName: "STORAGE",
        description,
        userId
      });
    } catch (error: any) {
      const message = error.response?.data?.message || error.response?.status || error.message || "Unknown error";
      this.logger.warn("AuditClient", `Failed to log ERROR: ${message}`);
    }
  }
}