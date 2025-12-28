import axios from 'axios';

export class AuditClient {
  private baseUrl: string;
  
  constructor(baseUrl: string = process.env.AUDIT_SERVICE_URL || 'http://localhost:3004') {
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
  }): Promise<void> {
    try {
      await axios.post(`${this.baseUrl}/api/v1/logs`, data, {
        timeout: 3000
      });
    } catch (error: any) {
      // Silent fallback - don't break auth if audit service is down
      console.error('\x1b[31m[AuditClient]\x1b[0m Failed to send audit log (silent fallback)');
    }
  }
  
  async logInfo(service: string, action: string, message: string, details?: any): Promise<void> {
    return this.log({
      service,
      action,
      logLevel: 'INFO',
      message,
      details,
      successful: true
    });
  }
  
  async logError(service: string, action: string, error: Error, context?: any): Promise<void> {
    return this.log({
      service,
      action,
      logLevel: 'ERROR',
      message: error.message,
      details: {
        error: error.stack,
        context
      },
      successful: false
    });
  }
  
  async logWarning(service: string, action: string, message: string, details?: any): Promise<void> {
    return this.log({
      service,
      action,
      logLevel: 'WARNING',
      message,
      details,
      successful: false
    });
  }
}