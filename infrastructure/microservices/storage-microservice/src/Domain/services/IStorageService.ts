import { Warehouse } from "../models/Warehouse";
import { StoragePackaging } from "../models/StoragePackaging";
import { CreateWarehouseDTO } from "../DTOs/CreateWarehouseDTO";

export interface IStorageService {
  // Warehouse methods
  createWarehouse(dto: CreateWarehouseDTO): Promise<Warehouse>;
  getWarehouseById(id: string): Promise<Warehouse>;
  getAllWarehouses(): Promise<Warehouse[]>;
  
  // Packaging methods
  receivePackaging(packagingId: string): Promise<StoragePackaging>;
  sendToSales(count: number, userRole: string): Promise<StoragePackaging[]>;
  getPackagingById(id: string): Promise<StoragePackaging>;
  getAllPackagings(): Promise<StoragePackaging[]>;
}