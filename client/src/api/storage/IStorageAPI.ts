import { WarehouseDTO, CreateWarehouseDTO, StoragePackagingDTO, SendToSalesDTO } from "../../models/storage/StorageDTO";

export interface IStorageAPI {
  getAllWarehouses(token: string): Promise<WarehouseDTO[]>;
  getWarehouseById(token: string, id: string): Promise<WarehouseDTO>;
  createWarehouse(token: string, data: CreateWarehouseDTO): Promise<any>;
  receivePackaging(token: string, packagingId: string): Promise<any>;
  sendToSales(token: string, data: SendToSalesDTO): Promise<any>;
  getAllPackagings(token: string): Promise<StoragePackagingDTO[]>;
  getPackagingById(token: string, id: string): Promise<StoragePackagingDTO>;
}
