import { PerfumeType } from "../../enums/PerfumeType";
import { PerfumeStatus } from "../../enums/PerfumeStatus";
import { PackagingStatus } from "../../enums/PackagingStatus";

export interface PerfumeDTO {
  id: string;
  name: string;
  type: PerfumeType;
  netQuantityMl: number;
  serialNumber: string;
  plantId: string;
  expirationDate: string;
  status: PerfumeStatus;
  packagingId?: string;
  createdAt: string;
}

export interface StartProcessingDTO {
  perfumeName: string;
  count: number;
  bottleSize: number;
  type: PerfumeType;
  plantCommonName: string;
}

export interface PackagingDTO {
  id: string;
  name: string;
  senderAddress: string;
  warehouseId: string;
  status: PackagingStatus;
  sentAt?: string;
  perfumeIds: string[];
  perfumes: PerfumeDTO[];
  createdAt: string;
}

export interface CreatePackagingDTO {
  name: string;
  senderAddress: string;
  warehouseId: string;
  perfumeIds: string[];
}

export interface SendPackagingDTO {
  packagingId: string;
}
