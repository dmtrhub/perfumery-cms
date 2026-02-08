import axios, { AxiosInstance } from "axios";
import { IAuditAPI } from "./IAuditAPI";
import { AuditLogDTO } from "../../models/audit/AuditDTO";

export class AuditAPI implements IAuditAPI {
  private readonly ax: AxiosInstance;

  constructor() {
    this.ax = axios.create({
      baseURL: import.meta.env.VITE_GATEWAY_URL,
      headers: { "Content-Type": "application/json" },
    });
  }

  private h(token: string) {
    return { headers: { Authorization: `Bearer ${token}` } };
  }

  async getAllLogs(token: string, type?: string, serviceName?: string, fromDate?: string, toDate?: string): Promise<AuditLogDTO[]> {
    const params: any = {};
    if (type) params.type = type;
    if (serviceName) params.serviceName = serviceName;
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;
    
    console.log("[AuditAPI] Sending request to /audit/logs with params:", params);
    
    const res = await this.ax.get("/audit/logs", { ...this.h(token), params });
    
    console.log("[AuditAPI] Response:", res.data);
    
    return res.data?.data || res.data;
  }

  async getLogById(token: string, id: string): Promise<AuditLogDTO> {
    const res = await this.ax.get(`/audit/logs/${id}`, this.h(token));
    return res.data?.data || res.data;
  }

  async deleteLog(token: string, id: string): Promise<any> {
    const res = await this.ax.delete(`/audit/logs/${id}`, this.h(token));
    return res.data;
  }
}
