import axios from "axios";
import { IGatewayService } from "../Domain/services/IGatewayService";
import { LoginUserDTO } from "../Domain/DTOs/LoginUserDTO";
import { RegistrationUserDTO } from "../Domain/DTOs/RegistrationUserDTO";
import { AuthResponseType } from "../Domain/types/AuthResponse";
import { UserDTO } from "../Domain/DTOs/UserDTO";
import { CreatePlantDTO } from "../Domain/DTOs/CreatePlantDTO";
import { CreatePerfumeDTO } from "../Domain/DTOs/CreatePerfumeDTO";
import { ProcessPlantsDTO } from "../Domain/DTOs/ProcessPlantsDTO";
import { GetPerfumesDTO } from "../Domain/DTOs/GetPerfumesDTO";
import { PackagingRequestDTO } from "../Domain/DTOs/PackagingRequestDTO";
import { ShipPackagingDTO } from "../Domain/DTOs/ShipPackagingDTO";
import { CreateAuditLogDTO } from "../Domain/DTOs/CreateAuditLogDTO";
import { QueryAuditLogsDTO } from "../Domain/DTOs/QueryAuditLogsDTO";

export class GatewayService implements IGatewayService {
  private readonly authClient;
  private readonly userClient;
  private readonly productionClient;
  private readonly processingClient;
  private readonly auditClient;
  constructor() {
    const authBaseURL = process.env.AUTH_SERVICE_API;
    const userBaseURL = process.env.USER_SERVICE_API;
    const productionBaseURL = process.env.PRODUCTION_SERVICE_API;
    const processingBaseURL = process.env.PROCESSING_SERVICE_API;
    const auditBaseURL = process.env.AUDIT_SERVICE_API;

    this.authClient = axios.create({
      baseURL: authBaseURL,
      headers: { "Content-Type": "application/json" },
      timeout: 5000,
    });

    this.userClient = axios.create({
      baseURL: userBaseURL,
      headers: { "Content-Type": "application/json" },
      timeout: 5000,
    });

    this.productionClient = axios.create({
      baseURL: productionBaseURL,
      headers: { "Content-Type": "application/json" },
      timeout: 10000,
    });

    this.processingClient = axios.create({
      baseURL: processingBaseURL,
      headers: { "Content-Type": "application/json" },
      timeout: 10000,
    });

    this.auditClient = axios.create({
      baseURL: auditBaseURL,
      headers: { "Content-Type": "application/json" },
      timeout: 3000,
    });
  }

  // === AUTH ===
  async login(data: LoginUserDTO): Promise<AuthResponseType> {
    try {
      const response = await this.authClient.post<AuthResponseType>("/api/v1/auth/login", data);
      return response.data;
    } catch {
      return { authenificated: false };
    }
  }

  async register(data: RegistrationUserDTO): Promise<AuthResponseType> {
    try {
      const response = await this.authClient.post<AuthResponseType>("/api/v1/auth/register", data);
      return response.data;
    } catch {
      return { authenificated: false };
    }
  }

  // === USERS ===
  async getAllUsers(): Promise<UserDTO[]> {
    const response = await this.userClient.get<UserDTO[]>("/api/v1/users");
    return response.data;
  }

  async getUserById(id: number): Promise<UserDTO> {
    const response = await this.userClient.get<UserDTO>(`/api/v1/users/${id}`);
    return response.data;
  }

  // === PRODUCTION ===
  async createPlant(data: CreatePlantDTO): Promise<any> {
    const response = await this.productionClient.post("/api/v1/plants", data);
    return response.data;
  }

  async getAllPlants(): Promise<any[]> {
    const response = await this.productionClient.get("/api/v1/plants");
    return response.data as any[];
  }

  async getPlantById(id: number): Promise<any> {
    const response = await this.productionClient.get(`/api/v1/plants/${id}`);
    return response.data;
  }

  async changeOilIntensity(plantId: number, percentage: number, userId?: number): Promise<any> {
    const response = await this.productionClient.put(`/api/v1/plants/${plantId}/oil-intensity`, {
      percentage,
      userId
    });
    return response.data;
  }

  async harvestPlants(plantId: number, quantity: number, forProcessing: boolean, userId?: number): Promise<any> {
    const response = await this.productionClient.post(`/api/v1/plants/${plantId}/harvest`, {
      quantity,
      forProcessing,
      userId
    });
    return response.data;
  }

  async getAvailablePlants(): Promise<any[]> {
    const response = await this.productionClient.get("/api/v1/plants/available");
    return response.data as any[];
  }

  async getPlantsForProcessing(): Promise<any[]> {
    const response = await this.productionClient.get("/api/v1/plants/for-processing");
    return response.data as any[];
  }

  async requestNewPlantForProcessing(processedPlantId: number, processedIntensity: number): Promise<any> {
    const response = await this.productionClient.post("/api/v1/plants/request-for-processing", {
      processedPlantId,
      processedIntensity
    });
    return response.data;
  }

  async getProductionLogs(): Promise<any[]> {
    const response = await this.productionClient.get("/api/v1/production-logs");
    return response.data as any[];
  }

  async getPlantLogs(plantId: number): Promise<any[]> {
    const response = await this.productionClient.get(`/api/v1/plants/${plantId}/logs`);
    return response.data as any[];
  }

  async getPlantsExceedingThreshold(): Promise<any[]> {
    const response = await this.productionClient.get("/api/v1/plants/exceeding-threshold");
    return response.data as any[];
  }

  // === PROCESSING ===
  async createPerfume(data: CreatePerfumeDTO): Promise<any> {
    const response = await this.processingClient.post("/api/v1/perfumes", data);
    return response.data;
  }

  async getAllPerfumes(filters?: GetPerfumesDTO): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters?.type) params.append('type', filters.type);
    if (filters?.minQuantity !== undefined) params.append('minQuantity', filters.minQuantity.toString());
    if (filters?.bottleSize) params.append('bottleSize', filters.bottleSize.toString());
    
    const response = await this.processingClient.get(`/api/v1/perfumes?${params.toString()}`);
    return response.data as any[];
  }

  async getPerfumeById(id: number): Promise<any> {
    const response = await this.processingClient.get(`/api/v1/perfumes/${id}`);
    return response.data;
  }

  async getPerfumeByType(type: string): Promise<any> {
    const response = await this.processingClient.get(`/api/v1/perfumes/type/${type}`);
    return response.data;
  }

  async updatePerfumeQuantity(id: number, quantity: number): Promise<any> {
    const response = await this.processingClient.put(`/api/v1/perfumes/${id}/quantity`, { quantity });
    return response.data;
  }

  async processPlants(data: ProcessPlantsDTO): Promise<any> {
    const response = await this.processingClient.post("/api/v1/process", data);
    return response.data;
  }

  async getAllProcessingBatches(filters?: any): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.perfumeType) params.append('perfumeType', filters.perfumeType);
    if (filters?.source) params.append('source', filters.source);
    
    const response = await this.processingClient.get(`/api/v1/batches?${params.toString()}`);
    return response.data as any[];
  }

  async getProcessingBatchById(id: number): Promise<any> {
    const response = await this.processingClient.get(`/api/v1/batches/${id}`);
    return response.data;
  }

  async cancelProcessingBatch(id: number, reason?: string): Promise<any> {
    const response = await this.processingClient.post(`/api/v1/batches/${id}/cancel`, { reason });
    return response.data;
  }

  async requestPerfumesForPackaging(data: PackagingRequestDTO): Promise<any> {
    const response = await this.processingClient.post("/api/v1/packaging/request", data);
    return response.data;
  }

  async getAllPackaging(filters?: any): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.perfumeType) params.append('perfumeType', filters.perfumeType);
    if (filters?.warehouseLocation) params.append('warehouseLocation', filters.warehouseLocation);
    if (filters?.shippedOnly) params.append('shippedOnly', 'true');
    
    const response = await this.processingClient.get(`/api/v1/packaging?${params.toString()}`);
    return response.data as any[];
  }

  async getAvailablePackaging(): Promise<any[]> {
    const response = await this.processingClient.get("/api/v1/packaging/available");
    return response.data as any[];
  }

  async getPackagingById(id: number): Promise<any> {
    const response = await this.processingClient.get(`/api/v1/packaging/${id}`);
    return response.data;
  }

  async shipPackagingToWarehouse(packagingId: number, data: ShipPackagingDTO): Promise<any> {
    const response = await this.processingClient.post(`/api/v1/packaging/${packagingId}/ship`, data);
    return response.data;
  }

  async createProcessingRequest(data: ProcessPlantsDTO): Promise<any> {
    const response = await this.processingClient.post("/api/v1/requests/process", data);
    return response.data;
  }

  async getProcessingRequests(filters?: any): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.source) params.append('source', filters.source);
    
    const response = await this.processingClient.get(`/api/v1/requests?${params.toString()}`);
    return response.data as any[];
  }

  async processPendingRequests(): Promise<any> {
    const response = await this.processingClient.post("/api/v1/requests/process-pending");
    return response.data;
  }

  async getPerfumeInventory(type?: string): Promise<any[]> {
    const url = type ? `/api/v1/inventory?type=${type}` : '/api/v1/inventory';
    const response = await this.processingClient.get(url);
    return response.data as any[];
  }

  async getSystemStatus(): Promise<any> {
    const response = await this.processingClient.get("/api/v1/status");
    return response.data;
  }

  async calculatePlantsNeeded(bottleCount: number, bottleSize: number): Promise<any> {
    const response = await this.processingClient.get(`/api/v1/plants-needed?bottleCount=${bottleCount}&bottleSize=${bottleSize}`);
    return response.data;
  }

  async getProcessingLogs(): Promise<any[]> {
    const response = await this.processingClient.get("/api/v1/logs");
    return response.data as any[];
  }

  // === AUDIT ===
  async createAuditLog(data: CreateAuditLogDTO): Promise<any> {
    const response = await this.auditClient.post("/api/v1/logs", data);
    return response.data;
  }

  async getAuditLogs(filters?: QueryAuditLogsDTO): Promise<any[]> {
    const params = new URLSearchParams();
    if (filters?.service) params.append('service', filters.service);
    if (filters?.action) params.append('action', filters.action);
    if (filters?.userId) params.append('userId', filters.userId.toString());
    if (filters?.entityId) params.append('entityId', filters.entityId);
    if (filters?.entityType) params.append('entityType', filters.entityType);
    if (filters?.logLevel) params.append('logLevel', filters.logLevel);
    if (filters?.startDate) params.append('startDate', filters.startDate.toISOString());
    if (filters?.endDate) params.append('endDate', filters.endDate.toISOString());
    if (filters?.search) params.append('search', filters.search);
    if (filters?.page) params.append('page', filters.page.toString());
    if (filters?.limit) params.append('limit', filters.limit.toString());
    
    const response = await this.auditClient.get(`/api/v1/logs?${params.toString()}`);
    return response.data as any[];
  }

  async getAuditLogById(id: number): Promise<any> {
    const response = await this.auditClient.get(`/api/v1/logs/${id}`);
    return response.data;
  }

  async getAuditLogsByService(service: string, limit?: number): Promise<any[]> {
    const url = limit ? `/api/v1/logs/service/${service}?limit=${limit}` : `/api/v1/logs/service/${service}`;
    const response = await this.auditClient.get(url);
    return response.data as any[];
  }

  async getAuditLogsByEntity(entityId: string, entityType?: string): Promise<any[]> {
    const url = entityType 
      ? `/api/v1/logs/entity/${entityId}?entityType=${entityType}`
      : `/api/v1/logs/entity/${entityId}`;
    const response = await this.auditClient.get(url);
    return response.data as any[];
  }

  async deleteOldAuditLogs(days: number): Promise<any> {
    const response = await this.auditClient.delete(`/api/v1/logs/cleanup/${days}`);
    return response.data;
  }

  // === HEALTH CHECK ===
  async healthCheck(): Promise<{ [key: string]: boolean }> {
    const services = [
      { name: 'auth', client: this.authClient },
      { name: 'user', client: this.userClient },
      { name: 'production', client: this.productionClient },
      { name: 'processing', client: this.processingClient },
      { name: 'audit', client: this.auditClient },
    ];

    const results: { [key: string]: boolean } = {};

    for (const service of services) {
      try {
        await service.client.get('/health');
        results[service.name] = true;
      } catch {
        results[service.name] = false;
      }
    }

    return results;
  }
}