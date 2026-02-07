export interface IAuditClient {
  logInfo(serviceName: string, description: string, userId?: string): Promise<void>;
  logWarning(serviceName: string, description: string, userId?: string): Promise<void>;
  logError(serviceName: string, description: string, userId?: string): Promise<void>;
}