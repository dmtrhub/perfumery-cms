import { WarehouseType } from "../enums/WarehouseType";

export interface CreateWarehouseDTO {
  name: string;
  location: string;
  maxCapacity: number;
  type: WarehouseType;
}