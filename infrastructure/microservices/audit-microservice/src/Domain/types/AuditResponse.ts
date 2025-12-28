export type AuditResponse<T = any> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
};

export type AuditLogsResponse = AuditResponse<Array<{
  id: number;
  service: string;
  action: string;
  message: string;
  timestamp: Date;
  successful: boolean;
}>>;