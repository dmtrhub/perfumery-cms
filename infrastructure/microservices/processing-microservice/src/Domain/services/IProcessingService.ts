import { Perfume } from "../models/Perfume";
import { ProcessingBatch } from "../models/ProcessingBatch";
import { ProcessingRequest } from "../models/ProcessingRequest";
import { Packaging } from "../models/Packaging";
import { CreatePerfumeDTO } from "../DTOs/CreatePerfumeDTO";
import { ProcessPlantsDTO } from "../DTOs/ProcessPlantsDTO";
import { GetPerfumesDTO } from "../DTOs/GetPerfumesDTO";
import { PackagingRequestDTO } from "../DTOs/PackagingRequestDTO";
import { PackagingStatus } from "../enums/PackagingStatus";

export interface IProcessingService {
  // Perfume Management
  createPerfume(data: CreatePerfumeDTO): Promise<Perfume>;
  getAllPerfumes(filters?: GetPerfumesDTO): Promise<Perfume[]>;
  getPerfumeById(id: number): Promise<Perfume | null>;
  getPerfumeByType(type: string): Promise<Perfume | null>;
  updatePerfumeQuantity(id: number, quantity: number): Promise<Perfume | null>;
  
  // Plant Processing
  processPlants(data: ProcessPlantsDTO): Promise<ProcessingBatch>;
  
  // Batch Management
  getProcessingBatch(id: number): Promise<ProcessingBatch | null>;
  getAllProcessingBatches(filters?: {
    status?: string;
    perfumeType?: string;
  }): Promise<ProcessingBatch[]>;
  cancelProcessingBatch(id: number, reason?: string): Promise<boolean>;
  
  // Processing Requests
  createProcessingRequest(data: ProcessPlantsDTO): Promise<ProcessingRequest>;
  getProcessingRequests(filters?: {
    status?: string;
    source?: string;
  }): Promise<ProcessingRequest[]>;
  processPendingRequests(): Promise<number>;
  
  // Packaging
  requestPerfumesForPackaging(data: PackagingRequestDTO): Promise<Packaging | null>;
  getAvailablePackaging(): Promise<Packaging[]>;
  getAllPackaging(): Promise<Packaging[]>;
  getPackagingById(id: number): Promise<Packaging | null>;
  
  sendPackagingToStorage(packagingId: number, warehouseId?: number): Promise<boolean>;
  updatePackagingStatus(packagingId: number, status: PackagingStatus): Promise<Packaging | null>;

  // Inventory & Reporting
  getPerfumeInventory(type?: string): Promise<
    Array<{
      type: string;
      available: number;
      reserved: number;
      total: number;
      bottleSize: number;
      totalVolumeMl: number;
    }>
  >;
  
  // Utilities
  calculatePlantsNeeded(bottleCount: number, bottleSize: number): number;
  getSystemStatus(): Promise<{
    totalPerfumes: number;
    totalBatches: number;
    pendingRequests: number;
    availablePackaging: number;
  }>;
}