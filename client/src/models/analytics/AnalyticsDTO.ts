import { SaleType } from "../../enums/SaleType";
import { PaymentMethod } from "../../enums/PaymentMethod";

export interface FiscalReceiptDTO {
  id: string;
  saleType: SaleType;
  paymentMethod: PaymentMethod;
  items: { perfumeId: string; quantity: number; price: number }[];
  totalAmount: number;
  userId: string;
  username: string;
  createdAt: string;
}

export interface AnalysisReportDTO {
  id: string;
  reportType: string;
  data: Record<string, any>;
  createdAt: string;
}

export interface SalesTotalDTO {
  totalRevenue: number;
  totalReceipts: number;
  totalItemsSold: number;
  averageOrderValue: number;
  period: string;
  [key: string]: any;
}

export interface SalesTrendDTO {
  date: string;
  totalAmount: number;
  receiptsCount: number;
}

export interface TopPerfumeDTO {
  perfumeId: string;
  name?: string;
  quantity: number;
  revenue: number;
}
