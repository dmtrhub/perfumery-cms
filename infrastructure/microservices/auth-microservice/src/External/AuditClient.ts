import axios, { AxiosInstance } from 'axios';
import { Logger } from '../Infrastructure/Logger';
import { IAuditClient } from './IAuditClient';

export class AuditClient implements IAuditClient {
  private readonly logger: Logger;
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.logger = Logger.getInstance();
    this.baseURL = process.env.AUDIT_SERVICE_URL || 'http://localhost:5003';
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000
    });
  }

  async logInfo(source: string, description: string, userId?: string): Promise<void> {
    try {
      await this.client.post('/api/v1/audit/logs', {
        type: 'INFO',
        description,
        serviceName: source,
        userId: userId || null
      });
    } catch (error: any) {
      const message = error.response?.data?.message || error.response?.status || error.message || 'Unknown error';
      this.logger.warn('AuditClient', `Failed to log INFO: ${message}`);
    }
  }

  async logWarning(source: string, description: string, userId?: string): Promise<void> {
    try {
      await this.client.post('/api/v1/audit/logs', {
        type: 'WARNING',
        description,
        serviceName: source,
        userId: userId || null
      });
    } catch (error: any) {
      const message = error.response?.data?.message || error.response?.status || error.message || 'Unknown error';
      this.logger.warn('AuditClient', `Failed to log WARNING: ${message}`);
    }
  }

  async logError(source: string, description: string, userId?: string): Promise<void> {
    try {
      await this.client.post('/api/v1/audit/logs', {
        type: 'ERROR',
        description,
        serviceName: source,
        userId: userId || null
      });
    } catch (error: any) {
      const message = error.response?.data?.message || error.response?.status || error.message || 'Unknown error';
      this.logger.warn('AuditClient', `Failed to log ERROR: ${message}`);
    }
  }
}
