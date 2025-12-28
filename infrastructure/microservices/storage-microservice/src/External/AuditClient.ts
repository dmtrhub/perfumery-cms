import axios from "axios";

export class AuditClient {
  private baseUrl: string;

  constructor(
    baseUrl: string = process.env.AUDIT_SERVICE_URL || "http://localhost:3004"
  ) {
    this.baseUrl = baseUrl;
  }

  async log(data: {
    service: string;
    action: string;
    userId?: number;
    userEmail?: string;
    entityId?: string;
    entityType?: string;
    logLevel?: string;
    message: string;
    details?: Record<string, any>;
    ipAddress?: string;
    userAgent?: string;
    successful?: boolean;
    source?: string;
  }): Promise<void> {
    try {
      await axios.post(`${this.baseUrl}/api/v1/logs`, data, {
        timeout: 5000, // 5 second timeout
      });
    } catch (error: any) {
      // Fallback to console if audit service is unavailable
      console.error(
        "\x1b[31m[AuditClient]\x1b[0m Failed to send audit log:",
        error.message
      );
      console.log("\x1b[35m[AuditClient]\x1b[0m Audit event (fallback):", {
        ...data,
        timestamp: new Date().toISOString(),
      });
    }
  }

  async logInfo(
    service: string,
    action: string,
    message: string,
    details?: any
  ): Promise<void> {
    return this.log({
      service,
      action,
      logLevel: "INFO",
      message,
      details,
    });
  }

  async logError(
    service: string,
    action: string,
    error: Error,
    context?: any
  ): Promise<void> {
    return this.log({
      service,
      action,
      logLevel: "ERROR",
      message: error.message,
      details: {
        error: error.stack,
        context,
      },
      successful: false,
    });
  }

  async logWarning(
    service: string,
    action: string,
    message: string,
    details?: any
  ): Promise<void> {
    return this.log({
      service,
      action,
      logLevel: "WARNING",
      message,
      details,
      successful: true,
    });
  }

  async logSystemEvent(
    service: string,
    message: string,
    details?: any
  ): Promise<void> {
    return this.log({
      service,
      action: "SYSTEM_EVENT",
      logLevel: "INFO",
      message,
      details,
      source: "SYSTEM",
    });
  }
}
