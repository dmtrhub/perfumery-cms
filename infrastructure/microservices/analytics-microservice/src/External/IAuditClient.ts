export interface IAuditClient {
  logInfo(source: string, description: string, userId?: string): Promise<void>;
  logWarning(source: string, description: string, userId?: string): Promise<void>;
  logError(source: string, description: string, userId?: string): Promise<void>;
}
