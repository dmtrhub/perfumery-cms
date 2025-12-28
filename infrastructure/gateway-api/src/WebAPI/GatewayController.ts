import { Request, Response, Router } from "express";
import { IGatewayService } from "../Domain/services/IGatewayService";
import { LoginUserDTO } from "../Domain/DTOs/LoginUserDTO";
import { RegistrationUserDTO } from "../Domain/DTOs/RegistrationUserDTO";
import { CreatePlantDTO } from "../Domain/DTOs/CreatePlantDTO";
import { CreatePerfumeDTO } from "../Domain/DTOs/CreatePerfumeDTO";
import { ProcessPlantsDTO } from "../Domain/DTOs/ProcessPlantsDTO";
import { GetPerfumesDTO } from "../Domain/DTOs/GetPerfumesDTO";
import { PackagingRequestDTO } from "../Domain/DTOs/PackagingRequestDTO";
import { ShipPackagingDTO } from "../Domain/DTOs/ShipPackagingDTO";
import { CreateAuditLogDTO } from "../Domain/DTOs/CreateAuditLogDTO";
import { QueryAuditLogsDTO } from "../Domain/DTOs/QueryAuditLogsDTO";
import { authenticate } from "../Middlewares/authentification/AuthMiddleware";
import { authorize } from "../Middlewares/authorization/AuthorizeMiddleware";
import { ServiceType } from "../Domain/enums/ServiceType";
import { AuditAction } from "../Domain/enums/AuditAction";
import { LogLevel } from "../Domain/enums/LogLevel";

export class GatewayController {
  private readonly router: Router;

  constructor(private readonly gatewayService: IGatewayService) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Auth
    this.router.post("/auth/login", this.login.bind(this));
    this.router.post("/auth/register", this.register.bind(this));

    // Users
    this.router.get("/users", authenticate, authorize("admin"), this.getAllUsers.bind(this));
    this.router.get("/users/:id", authenticate, authorize("admin", "seller"), this.getUserById.bind(this));

    // PRODUCTION ROUTES
    this.router.get("/plants", authenticate, authorize("seller", "manager"), this.getAllPlants.bind(this));
    this.router.get("/plants/:id", authenticate, authorize("seller", "manager"), this.getPlantById.bind(this));
    this.router.get("/plants/available", authenticate, authorize("seller", "manager"), this.getAvailablePlants.bind(this));
    this.router.get("/plants/for-processing", authenticate, authorize("seller", "manager"), this.getPlantsForProcessing.bind(this));
    this.router.get("/plants/exceeding-threshold", authenticate, authorize("seller", "manager"), this.getPlantsExceedingThreshold.bind(this));
    this.router.post("/plants", authenticate, authorize("manager"), this.createPlant.bind(this));
    this.router.put("/plants/:id/oil-intensity", authenticate, authorize("manager"), this.changeOilIntensity.bind(this));
    this.router.post("/plants/:id/harvest", authenticate, authorize("seller", "manager"), this.harvestPlants.bind(this));
    this.router.post("/plants/request-for-processing", authenticate, authorize("seller", "manager"), this.requestNewPlantForProcessing.bind(this));

    // PROCESSING ROUTES
    this.router.get("/perfumes", authenticate, authorize("seller", "manager"), this.getAllPerfumes.bind(this));
    this.router.get("/perfumes/:id", authenticate, authorize("seller", "manager"), this.getPerfumeById.bind(this));
    this.router.get("/perfumes/type/:type", authenticate, authorize("seller", "manager"), this.getPerfumeByType.bind(this));
    this.router.get("/inventory", authenticate, authorize("seller", "manager"), this.getPerfumeInventory.bind(this));
    this.router.get("/batches", authenticate, authorize("seller", "manager"), this.getAllProcessingBatches.bind(this));
    this.router.get("/batches/:id", authenticate, authorize("seller", "manager"), this.getProcessingBatchById.bind(this));
    this.router.get("/packaging", authenticate, authorize("seller", "manager"), this.getAllPackaging.bind(this));
    this.router.get("/packaging/available", authenticate, authorize("seller", "manager"), this.getAvailablePackaging.bind(this));
    this.router.get("/packaging/:id", authenticate, authorize("seller", "manager"), this.getPackagingById.bind(this));
    this.router.get("/requests", authenticate, authorize("seller", "manager"), this.getProcessingRequests.bind(this));
    this.router.get("/status", authenticate, authorize("seller", "manager"), this.getSystemStatus.bind(this));
    this.router.get("/plants-needed", authenticate, authorize("seller", "manager"), this.calculatePlantsNeeded.bind(this));
    this.router.get("/processing-logs", authenticate, authorize("seller", "manager"), this.getProcessingLogs.bind(this));

    // WRITE OPERATIONS
    this.router.post("/perfumes", authenticate, authorize("manager"), this.createPerfume.bind(this));
    this.router.put("/perfumes/:id/quantity", authenticate, authorize("manager"), this.updatePerfumeQuantity.bind(this));
    this.router.post("/process", authenticate, authorize("manager"), this.processPlants.bind(this));
    this.router.post("/batches/:id/cancel", authenticate, authorize("manager"), this.cancelProcessingBatch.bind(this));
    this.router.post("/packaging/request", authenticate, authorize("seller", "manager"), this.requestPerfumesForPackaging.bind(this));
    this.router.post("/packaging/:id/ship", authenticate, authorize("seller", "manager"), this.shipPackagingToWarehouse.bind(this));
    this.router.post("/requests/process", authenticate, authorize("manager"), this.createProcessingRequest.bind(this));
    this.router.post("/requests/process-pending", authenticate, authorize("manager"), this.processPendingRequests.bind(this));

    // PRODUCTION LOGS
    this.router.get("/production-logs", authenticate, authorize("seller", "manager"), this.getProductionLogs.bind(this));
    this.router.get("/plants/:id/logs", authenticate, authorize("seller", "manager"), this.getPlantLogs.bind(this));

    // AUDIT ROUTES
    this.router.get("/audit/logs", authenticate, authorize("admin"), this.getAuditLogs.bind(this));
    this.router.get("/audit/logs/:id", authenticate, authorize("admin"), this.getAuditLogById.bind(this));
    this.router.get("/audit/logs/service/:service", authenticate, authorize("admin"), this.getAuditLogsByService.bind(this));
    this.router.get("/audit/logs/entity/:entityId", authenticate, authorize("admin"), this.getAuditLogsByEntity.bind(this));
    this.router.post("/audit/logs", authenticate, authorize("admin"), this.createAuditLog.bind(this));
    this.router.delete("/audit/logs/cleanup/:days", authenticate, authorize("admin"), this.deleteOldAuditLogs.bind(this));
  }

  // Helper
  private validateServiceType(service: string): ServiceType | undefined {
  const validServices = Object.values(ServiceType);
    return validServices.includes(service as ServiceType) 
      ? service as ServiceType 
      : undefined;
  }

  private validateAuditAction(action: string): AuditAction | undefined {
    const validActions = Object.values(AuditAction);
    return validActions.includes(action as AuditAction) 
      ? action as AuditAction 
      : undefined;
  }

  private validateLogLevel(level: string): LogLevel | undefined {
    const validLevels = Object.values(LogLevel);
    return validLevels.includes(level as LogLevel) 
      ? level as LogLevel 
      : undefined;
  }

  // Auth
  private async login(req: Request, res: Response): Promise<void> {
    const data: LoginUserDTO = req.body;
    const result = await this.gatewayService.login(data);
    res.status(200).json(result);
  }

  private async register(req: Request, res: Response): Promise<void> {
    const data: RegistrationUserDTO = req.body;
    const result = await this.gatewayService.register(data);
    res.status(200).json(result);
  }

  // Users
  private async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const users = await this.gatewayService.getAllUsers();
      res.status(200).json(users);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  }

  private async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const user = await this.gatewayService.getUserById(id);
      res.status(200).json(user);
    } catch (err) {
      res.status(404).json({ message: (err as Error).message });
    }
  }

  // Production
  private async createPlant(req: Request, res: Response): Promise<void> {
    try {
      const data: CreatePlantDTO = req.body;
      const plant = await this.gatewayService.createPlant(data);
      res.status(201).json(plant);
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  }

  private async getAllPlants(req: Request, res: Response): Promise<void> {
    try {
      const plants = await this.gatewayService.getAllPlants();
      res.status(200).json(plants);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  }

  private async getPlantById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const plant = await this.gatewayService.getPlantById(id);
      res.status(200).json(plant);
    } catch (err) {
      res.status(404).json({ message: (err as Error).message });
    }
  }

  private async changeOilIntensity(req: Request, res: Response): Promise<void> {
    try {
      const plantId = parseInt(req.params.id, 10);
      const { percentage, userId } = req.body;
      const result = await this.gatewayService.changeOilIntensity(plantId, percentage, userId);
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  }

  private async harvestPlants(req: Request, res: Response): Promise<void> {
    try {
      const plantId = parseInt(req.params.id, 10);
      const { quantity, forProcessing, userId } = req.body;
      const result = await this.gatewayService.harvestPlants(plantId, quantity, forProcessing, userId);
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  }

  private async getAvailablePlants(req: Request, res: Response): Promise<void> {
    try {
      const plants = await this.gatewayService.getAvailablePlants();
      res.status(200).json(plants);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  }

  private async getPlantsForProcessing(req: Request, res: Response): Promise<void> {
    try {
      const plants = await this.gatewayService.getPlantsForProcessing();
      res.status(200).json(plants);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  }

  private async requestNewPlantForProcessing(req: Request, res: Response): Promise<void> {
    try {
      const { processedPlantId, processedIntensity } = req.body;
      const result = await this.gatewayService.requestNewPlantForProcessing(processedPlantId, processedIntensity);
      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  }

  private async getProductionLogs(req: Request, res: Response): Promise<void> {
    try {
      const logs = await this.gatewayService.getProductionLogs();
      res.status(200).json(logs);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  }

  private async getPlantLogs(req: Request, res: Response): Promise<void> {
    try {
      const plantId = parseInt(req.params.id, 10);
      const logs = await this.gatewayService.getPlantLogs(plantId);
      res.status(200).json(logs);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  }

  private async getPlantsExceedingThreshold(req: Request, res: Response): Promise<void> {
    try {
      const plants = await this.gatewayService.getPlantsExceedingThreshold();
      res.status(200).json(plants);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  }

  // Processing
  private async createPerfume(req: Request, res: Response): Promise<void> {
    try {
      const data: CreatePerfumeDTO = req.body;
      const perfume = await this.gatewayService.createPerfume(data);
      res.status(201).json(perfume);
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  }

  private async getAllPerfumes(req: Request, res: Response): Promise<void> {
    try {
      const typeParam = req.query.type as string;
      const validTypes = ["PERFUME", "COLOGNE"];
      
      const filters: GetPerfumesDTO = {
        type: validTypes.includes(typeParam) ? typeParam as "PERFUME" | "COLOGNE" : undefined,
        minQuantity: req.query.minQuantity ? parseInt(req.query.minQuantity as string) : undefined,
        bottleSize: req.query.bottleSize ? parseInt(req.query.bottleSize as string) : undefined,
      };
      
      const perfumes = await this.gatewayService.getAllPerfumes(filters);
      res.status(200).json(perfumes);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  }

  private async getPerfumeById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const perfume = await this.gatewayService.getPerfumeById(id);
      res.status(200).json(perfume);
    } catch (err) {
      res.status(404).json({ message: (err as Error).message });
    }
  }

  private async getPerfumeByType(req: Request, res: Response): Promise<void> {
    try {
      const type = req.params.type;
      const perfume = await this.gatewayService.getPerfumeByType(type);
      res.status(200).json(perfume);
    } catch (err) {
      res.status(404).json({ message: (err as Error).message });
    }
  }

  private async updatePerfumeQuantity(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const { quantity } = req.body;
      const perfume = await this.gatewayService.updatePerfumeQuantity(id, quantity);
      res.status(200).json(perfume);
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  }

  private async processPlants(req: Request, res: Response): Promise<void> {
    try {
      const data: ProcessPlantsDTO = req.body;
      const result = await this.gatewayService.processPlants(data);
      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  }

  private async getAllProcessingBatches(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        status: req.query.status as string,
        perfumeType: req.query.perfumeType as string,
        source: req.query.source as string,
      };
      const batches = await this.gatewayService.getAllProcessingBatches(filters);
      res.status(200).json(batches);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  }

  private async getProcessingBatchById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const batch = await this.gatewayService.getProcessingBatchById(id);
      res.status(200).json(batch);
    } catch (err) {
      res.status(404).json({ message: (err as Error).message });
    }
  }

  private async cancelProcessingBatch(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const { reason } = req.body;
      const result = await this.gatewayService.cancelProcessingBatch(id, reason);
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  }

  private async requestPerfumesForPackaging(req: Request, res: Response): Promise<void> {
    try {
      const data: PackagingRequestDTO = req.body;
      const result = await this.gatewayService.requestPerfumesForPackaging(data);
      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  }

  private async getAllPackaging(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        status: req.query.status as string,
        perfumeType: req.query.perfumeType as string,
        warehouseLocation: req.query.warehouseLocation as string,
        shippedOnly: req.query.shippedOnly === 'true',
      };
      const packaging = await this.gatewayService.getAllPackaging(filters);
      res.status(200).json(packaging);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  }

  private async getAvailablePackaging(req: Request, res: Response): Promise<void> {
    try {
      const packaging = await this.gatewayService.getAvailablePackaging();
      res.status(200).json(packaging);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  }

  private async getPackagingById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const packaging = await this.gatewayService.getPackagingById(id);
      res.status(200).json(packaging);
    } catch (err) {
      res.status(404).json({ message: (err as Error).message });
    }
  }

  private async shipPackagingToWarehouse(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const data: ShipPackagingDTO = req.body;
      const result = await this.gatewayService.shipPackagingToWarehouse(id, data);
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  }

  private async createProcessingRequest(req: Request, res: Response): Promise<void> {
    try {
      const data: ProcessPlantsDTO = req.body;
      const result = await this.gatewayService.createProcessingRequest(data);
      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  }

  private async getProcessingRequests(req: Request, res: Response): Promise<void> {
    try {
      const filters = {
        status: req.query.status as string,
        source: req.query.source as string,
      };
      const requests = await this.gatewayService.getProcessingRequests(filters);
      res.status(200).json(requests);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  }

  private async processPendingRequests(req: Request, res: Response): Promise<void> {
    try {
      const result = await this.gatewayService.processPendingRequests();
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  }

  private async getPerfumeInventory(req: Request, res: Response): Promise<void> {
    try {
      const type = req.query.type as string;
      const inventory = await this.gatewayService.getPerfumeInventory(type);
      res.status(200).json(inventory);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  }

  private async getSystemStatus(req: Request, res: Response): Promise<void> {
    try {
      const status = await this.gatewayService.getSystemStatus();
      res.status(200).json(status);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  }

  private async calculatePlantsNeeded(req: Request, res: Response): Promise<void> {
    try {
      const bottleCount = parseInt(req.query.bottleCount as string, 10);
      const bottleSize = parseInt(req.query.bottleSize as string, 10);
      
      if (isNaN(bottleCount) || isNaN(bottleSize)) {
        res.status(400).json({ message: "bottleCount and bottleSize are required and must be numbers" });
        return;
      }

      const result = await this.gatewayService.calculatePlantsNeeded(bottleCount, bottleSize);
      res.status(200).json(result);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  }

  private async getProcessingLogs(req: Request, res: Response): Promise<void> {
    try {
      const logs = await this.gatewayService.getProcessingLogs();
      res.status(200).json(logs);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  }

  // Audit
  private async createAuditLog(req: Request, res: Response): Promise<void> {
    try {
      const data: CreateAuditLogDTO = req.body;
      const result = await this.gatewayService.createAuditLog(data);
      res.status(201).json(result);
    } catch (err) {
      res.status(400).json({ message: (err as Error).message });
    }
  }

  private async getAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const filters: QueryAuditLogsDTO = {
        service: req.query.service ? this.validateServiceType(req.query.service as string) : undefined,
        action: req.query.action ? this.validateAuditAction(req.query.action as string) : undefined,
        userId: req.query.userId ? parseInt(req.query.userId as string) : undefined,
        entityId: req.query.entityId as string,
        entityType: req.query.entityType as string,
        logLevel: req.query.logLevel ? this.validateLogLevel(req.query.logLevel as string) : undefined,
        startDate: req.query.startDate ? new Date(req.query.startDate as string) : undefined,
        endDate: req.query.endDate ? new Date(req.query.endDate as string) : undefined,
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 100,
      };
      const logs = await this.gatewayService.getAuditLogs(filters);
      res.status(200).json(logs);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  }

  private async getAuditLogById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const log = await this.gatewayService.getAuditLogById(id);
      res.status(200).json(log);
    } catch (err) {
      res.status(404).json({ message: (err as Error).message });
    }
  }

  private async getAuditLogsByService(req: Request, res: Response): Promise<void> {
    try {
      const service = req.params.service;
      const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
      const logs = await this.gatewayService.getAuditLogsByService(service, limit);
      res.status(200).json(logs);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  }

  private async getAuditLogsByEntity(req: Request, res: Response): Promise<void> {
    try {
      const entityId = req.params.entityId;
      const entityType = req.query.entityType as string;
      const logs = await this.gatewayService.getAuditLogsByEntity(entityId, entityType);
      res.status(200).json(logs);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  }

  private async deleteOldAuditLogs(req: Request, res: Response): Promise<void> {
    try {
      const days = parseInt(req.params.days, 10);
      if (isNaN(days) || days < 1) {
        res.status(400).json({ message: "Invalid number of days" });
        return;
      }
      const result = await this.gatewayService.deleteOldAuditLogs(days);
      res.status(200).json(result);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}