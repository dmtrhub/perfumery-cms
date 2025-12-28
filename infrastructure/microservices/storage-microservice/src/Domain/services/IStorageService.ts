import { CreateWarehouseDTO } from "../DTOs/CreateWarehouseDTO";
import { Warehouse } from "../models/Warehouse";
import { StoragePackaging } from "../models/StoragePackaging";
import { ReceivePackagingDTO } from "../DTOs/ReceivePackagingDTO";
import { ShipPackagingDTO } from "../DTOs/ShipPackagingDTO";

export interface IStorageService {
  // Warehouse management
  createWarehouse(data: CreateWarehouseDTO): Promise<Warehouse>;
  getAllWarehouses(): Promise<Warehouse[]>;
  getWarehouseById(id: number): Promise<Warehouse | null>;
  
  // Packaging management
  receivePackaging(data: ReceivePackagingDTO): Promise<StoragePackaging>;
  getAllPackaging(): Promise<StoragePackaging[]>;
  getAvailablePackaging(perfumeType?: string): Promise<StoragePackaging[]>;
  getPackagingById(id: number): Promise<StoragePackaging | null>;
  
  // Shipping operations
  shipToSales(data: ShipPackagingDTO): Promise<StoragePackaging[]>;
  
  // Capacity management
  checkWarehouseCapacity(warehouseId: number): Promise<{
    max: number;
    current: number;
    available: number;
    percentage: number;
  }>;
  
  // System status
  getSystemStatus(): Promise<{
    totalWarehouses: number;
    totalPackaging: number;
    availablePackaging: number;
    reservedPackaging: number;
  }>;
}