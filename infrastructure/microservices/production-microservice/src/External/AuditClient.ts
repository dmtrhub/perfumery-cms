import axios, { AxiosInstance } from "axios";
import { IAuditClient } from "./IAuditClient";
import { Logger } from "../Infrastructure/Logger";

/**
 * AuditClient
 * 
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
      headers: {
        "X-Service-Name": "PRODUCTION_SERVICE"
      }
    });
  }

  /**
   * Log INFO
   */
  async logInfo(serviceName: string, description: string, userId?: string): Promise<void> {
    try {
      this.logger.debug("AuditClient", `Logging INFO: ${description}`);

      await this.axiosInstance.post("/api/v1/audit/logs", {
        type: "INFO",
        serviceName,
        description,
        userId,
        ipAddress: "127.0.0.1"
      });
    } catch (error: any) {
      const message = error.response?.data?.message || error.response?.status || error.message || "Unknown error";
      this.logger.warn("AuditClient", `Failed to log INFO: ${message}`);
    }
  }

  /**
   * Log WARNING
   */
  async logWarning(serviceName: string, description: string, userId?: string): Promise<void> {
    try {
      this.logger.debug("AuditClient", `Logging WARNING: ${description}`);

      await this.axiosInstance.post("/api/v1/audit/logs", {
        type: "WARNING",
        serviceName,
        description,
        userId,
        ipAddress: "127.0.0.1"
      });
    } catch (error: any) {
      const message = error.response?.data?.message || error.response?.status || error.message || "Unknown error";
      this.logger.warn("AuditClient", `Failed to log WARNING: ${message}`);
    }
  }

  /**
   * Log ERROR
   */
  async logError(serviceName: string, description: string, userId?: string): Promise<void> {
    try {
      this.logger.debug("AuditClient", `Logging ERROR: ${description}`);

      await this.axiosInstance.post("/api/v1/audit/logs", {
        type: "ERROR",
        serviceName,
        description,
        userId,
        ipAddress: "127.0.0.1"
      });
    } catch (error: any) {
      const message = error.response?.data?.message || error.response?.status || error.message || "Unknown error";
      this.logger.warn("AuditClient", `Failed to log ERROR: ${message}`);
    }
  }
}