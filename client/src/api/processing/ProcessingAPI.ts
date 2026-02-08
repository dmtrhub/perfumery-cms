import axios, { AxiosInstance } from "axios";
import { IProcessingAPI } from "./IProcessingAPI";
import { PerfumeDTO, PackagingDTO, StartProcessingDTO, CreatePackagingDTO, SendPackagingDTO } from "../../models/processing/ProcessingDTO";

export class ProcessingAPI implements IProcessingAPI {
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

  async startProcessing(token: string, data: StartProcessingDTO): Promise<any> {
    const res = await this.ax.post("/processing/start", data, this.h(token));
    return res.data;
  }

  async getAllPerfumes(token: string, type?: string, status?: string): Promise<PerfumeDTO[]> {
    const params: any = {};
    if (type) params.type = type;
    if (status) params.status = status;
    const res = await this.ax.get("/processing/perfumes", { ...this.h(token), params });
    return res.data?.data || res.data;
  }

  async getPerfumeById(token: string, id: string): Promise<PerfumeDTO> {
    const res = await this.ax.get(`/processing/perfumes/${id}`, this.h(token));
    return res.data?.data || res.data;
  }

  async createPackaging(token: string, data: CreatePackagingDTO): Promise<any> {
    const res = await this.ax.post("/processing/packaging", data, this.h(token));
    return res.data;
  }

  async sendPackaging(token: string, data: SendPackagingDTO): Promise<any> {
    const res = await this.ax.post("/processing/packaging/send", data, this.h(token));
    return res.data;
  }

  async getPackagingById(token: string, id: string): Promise<PackagingDTO> {
    const res = await this.ax.get(`/processing/packaging/${id}`, this.h(token));
    return res.data?.data || res.data;
  }

  async getPackagings(token: string): Promise<PackagingDTO[]> {
    const res = await this.ax.get("/processing/packaging", this.h(token));
    return res.data?.data || res.data;
  }
}
