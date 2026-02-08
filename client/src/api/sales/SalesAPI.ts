import axios, { AxiosInstance } from "axios";
import { ISalesAPI } from "./ISalesAPI";
import { CatalogItemDTO, PurchaseDTO, SalesPackagingDTO } from "../../models/sales/SalesDTO";

export class SalesAPI implements ISalesAPI {
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

  async getCatalog(token: string): Promise<CatalogItemDTO[]> {
    const res = await this.ax.get("/sales/catalog", this.h(token));
    const items = res.data?.data || res.data;
    // Convert price from string/decimal to number
    return Array.isArray(items) ? items.map(item => ({
      ...item,
      price: parseFloat(item.price)
    })) : items;
  }

  async getPackagings(token: string): Promise<SalesPackagingDTO[]> {
    const res = await this.ax.get("/sales/packaging", this.h(token));
    return res.data?.data || res.data;
  }

  async purchase(token: string, data: PurchaseDTO): Promise<any> {
    const res = await this.ax.post("/sales/purchase", data, this.h(token));
    return res.data;
  }

  async requestPackaging(token: string, count: number): Promise<any> {
    const res = await this.ax.post("/sales/request-packaging", { count }, this.h(token));
    return res.data;
  }
}
