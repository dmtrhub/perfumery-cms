import { PerfumeType } from "../../enums/PerfumeType";
import { SaleType } from "../../enums/SaleType";
import { PaymentMethod } from "../../enums/PaymentMethod";

export interface CatalogItemDTO {
  perfumeId: string;
  name: string;
  type: PerfumeType;
  netQuantityMl: number;
  quantity: number;
  available: boolean;
  price: number;
}

export interface PurchaseItemDTO {
  perfumeId: string;
  quantity: number;
}

export interface PurchaseDTO {
  items: PurchaseItemDTO[];
  saleType: SaleType;
  paymentMethod: PaymentMethod;
}

export interface SalesPackagingDTO {
  id: string;
  originalPackagingId: string;
  perfumeIds: string[];
  perfumes: any[];
  status: string;
  receivedAt: string;
}
