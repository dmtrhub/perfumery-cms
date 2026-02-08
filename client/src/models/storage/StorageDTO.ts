import { WarehouseType } from "../../enums/WarehouseType";

export interface WarehouseDTO {
  id: string;
  name: string;
  location: string;
  maxCapacity: number;
  type: WarehouseType;
  currentCapacity: number;
  createdAt: string;
}

export interface CreateWarehouseDTO {
  name: string;
  location: string;
  maxCapacity: number;
  type: WarehouseType;
}

export interface StoragePackagingDTO {
  id: string;
  originalPackagingId: string;
  warehouseId: string;
  perfumeIds: string[];
  perfumes: any[];
  status: string;
  sentToSalesAt?: string;
  createdAt: string;
}

export interface SendToSalesDTO {
  count: number;
}
