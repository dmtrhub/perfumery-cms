import { LoginUserDTO } from "../DTOs/LoginUserDTO";
import { RegistrationUserDTO } from "../DTOs/RegistrationUserDTO";
import { CreatePlantDTO } from "../DTOs/CreatePlantDTO";
import { CreatePerfumeDTO } from "../DTOs/CreatePerfumeDTO";
import { ProcessPlantsDTO } from "../DTOs/ProcessPlantsDTO";
import { GetPerfumesDTO } from "../DTOs/GetPerfumesDTO";
import { PackagingRequestDTO } from "../DTOs/PackagingRequestDTO";
import { ShipPackagingDTO } from "../DTOs/ShipPackagingDTO";
import { CreateAuditLogDTO } from "../DTOs/CreateAuditLogDTO";
import { QueryAuditLogsDTO } from "../DTOs/QueryAuditLogsDTO";
import { AuthResponseType } from "../types/AuthResponse";
import { UserDTO } from "../DTOs/UserDTO";

export interface IGatewayService {
  // ===== AUTH METHODS =====
  login(data: LoginUserDTO): Promise<AuthResponseType>;
  register(data: RegistrationUserDTO): Promise<AuthResponseType>;

  // ===== USERS METHODS =====
  getAllUsers(): Promise<UserDTO[]>;
  getUserById(id: number): Promise<UserDTO>;

  // ===== PRODUCTION METHODS (BILJKE) =====
  createPlant(data: CreatePlantDTO): Promise<any>;
  getAllPlants(): Promise<any[]>;
  getPlantById(id: number): Promise<any>;
  changeOilIntensity(plantId: number, percentage: number, userId?: number): Promise<any>;
  harvestPlants(plantId: number, quantity: number, forProcessing: boolean, userId?: number): Promise<any>;
  getAvailablePlants(): Promise<any[]>;
  getPlantsForProcessing(): Promise<any[]>;
  requestNewPlantForProcessing(processedPlantId: number, processedIntensity: number): Promise<any>;
  getProductionLogs(): Promise<any[]>;
  getPlantLogs(plantId: number): Promise<any[]>;
  getPlantsExceedingThreshold(): Promise<any[]>;

  // ===== PROCESSING METHODS (PARFEMI) =====
  createPerfume(data: CreatePerfumeDTO): Promise<any>;
  getAllPerfumes(filters?: GetPerfumesDTO): Promise<any[]>;
  getPerfumeById(id: number): Promise<any>;
  getPerfumeByType(type: string): Promise<any>;
  updatePerfumeQuantity(id: number, quantity: number): Promise<any>;
  processPlants(data: ProcessPlantsDTO): Promise<any>;
  getAllProcessingBatches(filters?: any): Promise<any[]>;
  getProcessingBatchById(id: number): Promise<any>;
  cancelProcessingBatch(id: number, reason?: string): Promise<any>;
  requestPerfumesForPackaging(data: PackagingRequestDTO): Promise<any>;
  getAllPackaging(filters?: any): Promise<any[]>;
  getAvailablePackaging(): Promise<any[]>;
  getPackagingById(id: number): Promise<any>;
  shipPackagingToWarehouse(packagingId: number, data: ShipPackagingDTO): Promise<any>;
  createProcessingRequest(data: ProcessPlantsDTO): Promise<any>;
  getProcessingRequests(filters?: any): Promise<any[]>;
  processPendingRequests(): Promise<any>;
  getPerfumeInventory(type?: string): Promise<any[]>;
  getSystemStatus(): Promise<any>;
  calculatePlantsNeeded(bottleCount: number, bottleSize: number): Promise<any>;
  getProcessingLogs(): Promise<any[]>;

  // ===== AUDIT METHODS =====
  createAuditLog(data: CreateAuditLogDTO): Promise<any>;
  getAuditLogs(filters?: QueryAuditLogsDTO): Promise<any[]>;
  getAuditLogById(id: number): Promise<any>;
  getAuditLogsByService(service: string, limit?: number): Promise<any[]>;
  getAuditLogsByEntity(entityId: string, entityType?: string): Promise<any[]>;
  deleteOldAuditLogs(days: number): Promise<any>;

  // ===== HEALTH CHECK =====
  healthCheck(): Promise<{ [key: string]: boolean }>;
}