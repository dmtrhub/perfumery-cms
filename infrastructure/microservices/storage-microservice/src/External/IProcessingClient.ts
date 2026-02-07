export interface PackagingDTO {
  id: string;
  name: string;
  senderAddress: string;
  warehouseId: string;
  status: string;
  sentAt?: Date;
  perfumeIds: string[];
  perfumes: PerfumeDTO[];
  createdAt: Date;
}

export interface PerfumeDTO {
  id: string;
  name: string;
  type: string;
  netQuantityMl: number;
  serialNumber: string;
  plantId: string;
  expirationDate: Date;
  status: string;
  createdAt: Date;
}

export interface IProcessingClient {
  getPackagingById(packagingId: string): Promise<PackagingDTO>;
}