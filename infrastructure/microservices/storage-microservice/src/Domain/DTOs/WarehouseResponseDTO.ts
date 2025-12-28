import { WarehouseType } from "../enums/WarehouseType";

export interface WarehouseResponseDTO {
  id: number;
  name: string;
  location: string;
  maxCapacity: number;
  currentCapacity: number;
  type: WarehouseType;
  availableSpace: number;
}