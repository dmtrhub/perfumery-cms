import axios, { AxiosInstance } from "axios";
import { IStorageAPI } from "./IStorageAPI";
import { WarehouseDTO, CreateWarehouseDTO, StoragePackagingDTO, SendToSalesDTO } from "../../models/storage/StorageDTO";

export class StorageAPI implements IStorageAPI {
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

  async getAllWarehouses(token: string): Promise<WarehouseDTO[]> {
    const res = await this.ax.get("/storage/warehouses", this.h(token));
    return res.data?.data || res.data;
  }

  async getWarehouseById(token: string, id: string): Promise<WarehouseDTO> {
    const res = await this.ax.get(`/storage/warehouses/${id}`, this.h(token));
    return res.data?.data || res.data;
  }

  async createWarehouse(token: string, data: CreateWarehouseDTO): Promise<any> {
    const res = await this.ax.post("/storage/warehouses", data, this.h(token));
    return res.data;
  }

  async receivePackaging(token: string, packagingId: string): Promise<any> {
    const res = await this.ax.post("/storage/receive", { packagingId }, this.h(token));
    return res.data;
  }

  async sendToSales(token: string, data: SendToSalesDTO): Promise<any> {
    const res = await this.ax.post("/storage/send-to-sales", data, this.h(token));
    return res.data;
  }

  async getAllPackagings(token: string): Promise<StoragePackagingDTO[]> {
    const res = await this.ax.get("/storage/packagings", this.h(token));
    return res.data?.data || res.data;
  }

  async getPackagingById(token: string, id: string): Promise<StoragePackagingDTO> {
    const res = await this.ax.get(`/storage/packagings/${id}`, this.h(token));
    return res.data?.data || res.data;
  }
}
