import { WarehouseType } from "../enums/WarehouseType";

export class WarehouseResponseDTO {
  id!: string;
  name!: string;
  location!: string;
  maxCapacity!: number;
  type!: string;
  currentCapacity!: number;
  createdAt!: Date;
}