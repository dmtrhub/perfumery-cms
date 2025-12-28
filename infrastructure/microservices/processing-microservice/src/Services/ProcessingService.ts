import { Repository } from "typeorm";
import { Perfume } from "../Domain/models/Perfume";
import { ProcessingBatch } from "../Domain/models/ProcessingBatch";
import { ProcessingRequest } from "../Domain/models/ProcessingRequest";
import { Packaging } from "../Domain/models/Packaging";
import { IProcessingService } from "../Domain/services/IProcessingService";
import { CreatePerfumeDTO } from "../Domain/DTOs/CreatePerfumeDTO";
import { ProcessPlantsDTO } from "../Domain/DTOs/ProcessPlantsDTO";
import { GetPerfumesDTO } from "../Domain/DTOs/GetPerfumesDTO";
import { PackagingRequestDTO } from "../Domain/DTOs/PackagingRequestDTO";
import { ShipPackagingDTO } from "../Domain/DTOs/ShipPackagingDTO";
import { ProcessingStatus } from "../Domain/enums/ProcessingStatus";
import { PerfumeType } from "../Domain/enums/PerfumeType";
import { SourceType } from "../Domain/enums/SourceType";
import { PackagingStatus } from "../Domain/enums/PackagingStatus";
import { ProductionClient } from "../External/ProductionClient";
import { AuditClient } from "../External/AuditClient";

export class ProcessingService implements IProcessingService {
  private productionClient: ProductionClient;
  private auditClient: AuditClient;

  constructor(
    private perfumeRepository: Repository<Perfume>,
    private processingBatchRepository: Repository<ProcessingBatch>,
    private processingRequestRepository: Repository<ProcessingRequest>,
    private packagingRepository: Repository<Packaging>
  ) {
    this.productionClient = new ProductionClient();
    this.auditClient = new AuditClient();
    
    // AUDIT: Log service start
    this.auditClient.logInfo(
      "PROCESSING",
      "SERVICE_STARTED",
      "Processing Service started",
      { timestamp: new Date().toISOString() }
    ).catch(console.error);
    
    console.log("\x1b[36m[ProcessingService@1.0.0]\x1b[0m Service started");
  }

  async createPerfume(data: CreatePerfumeDTO): Promise<Perfume> {
    try {
      console.log(`\x1b[36m[ProcessingService]\x1b[0m Creating perfume: ${data.name}`);

      // AUDIT: Log start
      await this.auditClient.logInfo(
        "PROCESSING",
        "CREATE_PERFUME_STARTED",
        `Creating new perfume: ${data.name}`,
        { ...data, timestamp: new Date().toISOString() }
      );

      const perfume = new Perfume();
      perfume.name = data.name;
      perfume.type = data.type;
      perfume.bottleSize = data.bottleSize;
      perfume.quantity = data.initialQuantity || 0;
      perfume.totalVolumeMl = perfume.quantity * perfume.bottleSize;

      const savedPerfume = await this.perfumeRepository.save(perfume);

      // AUDIT: Log success
      await this.auditClient.logInfo(
        "PROCESSING",
        "CREATE_PERFUME_SUCCESS",
        `Perfume created: ${data.name} (ID: ${savedPerfume.id})`,
        {
          perfumeId: savedPerfume.id,
          name: data.name,
          type: data.type,
          bottleSize: data.bottleSize,
          quantity: savedPerfume.quantity,
          timestamp: new Date().toISOString(),
        }
      );

      console.log(
        `\x1b[32m[ProcessingService]\x1b[0m Perfume created: ${data.name} (ID: ${savedPerfume.id})`
      );
      return savedPerfume;
    } catch (error: any) {
      console.error(
        `\x1b[31m[ProcessingService]\x1b[0m Failed to create perfume:`,
        error
      );

      // AUDIT: Log error
      await this.auditClient.logError(
        "PROCESSING",
        "CREATE_PERFUME_FAILED",
        error,
        {
          perfumeName: data.name,
          ...data,
          timestamp: new Date().toISOString(),
        }
      );

      throw new Error(`Failed to create perfume: ${error.message}`);
    }
  }

  async getAllPerfumes(filters?: GetPerfumesDTO): Promise<Perfume[]> {
    try {
      console.log("\x1b[36m[ProcessingService]\x1b[0m Getting all perfumes");

      // AUDIT: Log start
      await this.auditClient.logInfo(
        "PROCESSING",
        "GET_ALL_PERFUMES",
        "Retrieving all perfumes from database",
        { timestamp: new Date().toISOString() }
      );

      let query = this.perfumeRepository.createQueryBuilder("perfume");

      if (filters?.type) {
        query = query.where("perfume.type = :type", { type: filters.type });
      }

      if (filters?.minQuantity !== undefined) {
        query = query.andWhere("perfume.quantity >= :minQuantity", {
          minQuantity: filters.minQuantity,
        });
      }

      if (filters?.bottleSize) {
        query = query.andWhere("perfume.bottleSize = :bottleSize", {
          bottleSize: filters.bottleSize,
        });
      }

      const perfumes = await query.getMany();
      const count = perfumes.length;

      // AUDIT: Log success
      await this.auditClient.logInfo(
        "PROCESSING",
        "GET_ALL_PERFUMES_SUCCESS",
        `Retrieved ${count} perfumes from database`,
        { count, timestamp: new Date().toISOString() }
      );

      return perfumes;
    } catch (error: any) {
      console.error(
        `\x1b[31m[ProcessingService]\x1b[0m Failed to get all perfumes:`,
        error
      );

      // AUDIT: Log error
      await this.auditClient.logError(
        "PROCESSING",
        "GET_ALL_PERFUMES_FAILED",
        error,
        { timestamp: new Date().toISOString() }
      );

      throw new Error(`Failed to get all perfumes: ${error.message}`);
    }
  }

  async getPerfumeById(id: number): Promise<Perfume | null> {
    try {
      console.log(
        `\x1b[36m[ProcessingService]\x1b[0m Getting perfume by ID: ${id}`
      );

      // AUDIT: Log start
      await this.auditClient.logInfo(
        "PROCESSING",
        "GET_PERFUME_BY_ID",
        `Retrieving perfume with ID: ${id}`,
        { perfumeId: id, timestamp: new Date().toISOString() }
      );

      const perfume = await this.perfumeRepository.findOne({ where: { id } });

      if (perfume) {
        // AUDIT: Log success
        await this.auditClient.logInfo(
          "PROCESSING",
          "GET_PERFUME_BY_ID_SUCCESS",
          `Found perfume: ${perfume.name} (ID: ${perfume.id})`,
          {
            perfumeId: id,
            perfumeName: perfume.name,
            timestamp: new Date().toISOString(),
          }
        );
        return perfume;
      } else {
        // AUDIT: Log not found
        await this.auditClient.logWarning(
          "PROCESSING",
          "GET_PERFUME_BY_ID_NOT_FOUND",
          `Perfume not found with ID: ${id}`,
          { perfumeId: id, timestamp: new Date().toISOString() }
        );
        return null;
      }
    } catch (error: any) {
      console.error(
        `\x1b[31m[ProcessingService]\x1b[0m Failed to get perfume by ID ${id}:`,
        error
      );

      // AUDIT: Log error
      await this.auditClient.logError(
        "PROCESSING",
        "GET_PERFUME_BY_ID_FAILED",
        error,
        { perfumeId: id, timestamp: new Date().toISOString() }
      );

      throw new Error(`Failed to get perfume by ID: ${error.message}`);
    }
  }

  async getPerfumeByType(type: string): Promise<Perfume | null> {
    try {
      console.log(
        `\x1b[36m[ProcessingService]\x1b[0m Getting perfume by type: ${type}`
      );

      const perfume = await this.perfumeRepository.findOne({
        where: { type: type as PerfumeType },
      });

      return perfume;
    } catch (error: any) {
      console.error(
        `\x1b[31m[ProcessingService]\x1b[0m Failed to get perfume by type ${type}:`,
        error
      );
      throw new Error(`Failed to get perfume by type: ${error.message}`);
    }
  }

  async updatePerfumeQuantity(id: number, quantity: number): Promise<Perfume | null> {
    try {
      console.log(
        `\x1b[36m[ProcessingService]\x1b[0m Updating perfume quantity for ID: ${id}`
      );

      // AUDIT: Log start
      await this.auditClient.logInfo(
        "PROCESSING",
        "UPDATE_PERFUME_QUANTITY_STARTED",
        `Updating perfume quantity for ID: ${id}`,
        { perfumeId: id, newQuantity: quantity, timestamp: new Date().toISOString() }
      );

      const perfume = await this.getPerfumeById(id);
      if (!perfume) return null;

      const oldQuantity = perfume.quantity;
      perfume.quantity = quantity;
      perfume.totalVolumeMl = quantity * perfume.bottleSize;

      const updatedPerfume = await this.perfumeRepository.save(perfume);

      // AUDIT: Log success
      await this.auditClient.logInfo(
        "PROCESSING",
        "UPDATE_PERFUME_QUANTITY_SUCCESS",
        `Updated perfume ${perfume.name} quantity from ${oldQuantity} to ${quantity}`,
        {
          perfumeId: id,
          perfumeName: perfume.name,
          oldQuantity,
          newQuantity: quantity,
          timestamp: new Date().toISOString(),
        }
      );

      return updatedPerfume;
    } catch (error: any) {
      console.error(
        `\x1b[31m[ProcessingService]\x1b[0m Failed to update perfume quantity:`,
        error
      );

      // AUDIT: Log error
      await this.auditClient.logError(
        "PROCESSING",
        "UPDATE_PERFUME_QUANTITY_FAILED",
        error,
        { perfumeId: id, newQuantity: quantity, timestamp: new Date().toISOString() }
      );

      throw new Error(`Failed to update perfume quantity: ${error.message}`);
    }
  }

  async processPlants(data: ProcessPlantsDTO): Promise<ProcessingBatch> {
    try {
      console.log(
        `\x1b[36m[ProcessingService]\x1b[0m Processing plants for: ${data.perfumeType}`
      );

      // AUDIT: Log start
      await this.auditClient.logInfo(
        "PROCESSING",
        "PROCESS_PLANTS_STARTED",
        `Starting plant processing for: ${data.perfumeType}`,
        { ...data, timestamp: new Date().toISOString() }
      );

      // 1. Calculate plants needed: 1 plant = 50ml perfume
      const totalMlNeeded = data.bottleCount * data.bottleSize;
      const plantsNeeded = Math.ceil(totalMlNeeded / 50);

      // 2. Check plant availability via ProductionClient
      const availability = await this.checkPlantAvailability(
        data.perfumeType,
        data.bottleCount,
        data.bottleSize
      );

      if (!availability.available) {
        throw new Error(availability.message);
      }

      // 3. Get available plants for processing
      const availablePlants = await this.productionClient.getPlantsForProcessing();
      
      if (!availablePlants.success || !availablePlants.data || availablePlants.data.length === 0) {
        throw new Error("No plants available for processing");
      }

      // 4. Find suitable plants of the correct type
      const suitablePlants = availablePlants.data.filter(
        (plant: any) => plant.plantType === data.perfumeType && plant.quantity >= plantsNeeded
      );

      if (suitablePlants.length === 0) {
        throw new Error(`No ${data.perfumeType} plants available for processing. Need ${plantsNeeded} plants`);
      }

      // 5. Take the first available plant
      const selectedPlant = suitablePlants[0];

      // 6. Check if oil intensity exceeds 4.00 threshold
      if (selectedPlant.oilIntensity > 4.00) {
        // Balance plant oil intensity
        const userIdStr = data.userId ? data.userId.toString() : "unknown";
        await this.balancePlantOilIntensity(selectedPlant.id, selectedPlant.oilIntensity, userIdStr);
      }

      // 7. Harvest plants for processing via ProductionClient
      const harvestUserId = data.userId ? data.userId.toString() : "unknown";
      const harvestResult = await this.productionClient.harvestPlantsForProcessing(
        selectedPlant.id,
        plantsNeeded,
        harvestUserId
      );

      if (!harvestResult.success) {
        throw new Error(`Failed to harvest plants: ${harvestResult.message}`);
      }

      // 8. Get or create perfume
      let perfume = await this.getPerfumeByType(data.perfumeType);
      if (!perfume) {
        perfume = await this.createPerfume({
          name: `${data.perfumeType} Perfume`,
          type: data.perfumeType,
          bottleSize: data.bottleSize,
          userId: data.userId,
        });
      }

      // 9. Create processing batch
      const batch = new ProcessingBatch();
      batch.perfume = perfume;
      batch.perfumeId = perfume.id;
      batch.bottleCount = data.bottleCount;
      batch.plantsNeeded = plantsNeeded;
      batch.status = ProcessingStatus.PROCESSING;
      batch.source = data.source || SourceType.CLIENT;
      batch.requestId = data.externalRequestId;
      batch.userId = data.userId;
      batch.plantId = selectedPlant.id;
      batch.oilIntensity = selectedPlant.oilIntensity;

      const savedBatch = await this.processingBatchRepository.save(batch);

      // 10. Simulate processing
      await this.simulateProcessing(savedBatch);

      // 11. Update perfume inventory
      perfume.addProduction(data.bottleCount);
      await this.perfumeRepository.save(perfume);

      // 12. Complete batch
      savedBatch.markAsCompleted();
      const completedBatch = await this.processingBatchRepository.save(savedBatch);

      // 13. Create processing request record
      await this.createProcessingRequestRecord(data, plantsNeeded);

      // AUDIT: Log success
      await this.auditClient.logInfo(
        "PROCESSING",
        "PROCESS_PLANTS_SUCCESS",
        `Successfully processed ${data.bottleCount} bottles of ${data.perfumeType}`,
        {
          batchId: completedBatch.id,
          perfumeType: data.perfumeType,
          bottleCount: data.bottleCount,
          plantsNeeded,
          plantId: selectedPlant.id,
          oilIntensity: selectedPlant.oilIntensity,
          timestamp: new Date().toISOString(),
        }
      );

      console.log(
        `\x1b[32m[ProcessingService]\x1b[0m Successfully processed ${data.bottleCount} bottles of ${data.perfumeType}`
      );
      return completedBatch;
    } catch (error: any) {
      console.error(
        `\x1b[31m[ProcessingService]\x1b[0m Failed to process plants:`,
        error
      );

      // AUDIT: Log error
      await this.auditClient.logError(
        "PROCESSING",
        "PROCESS_PLANTS_FAILED",
        error,
        { ...data, timestamp: new Date().toISOString() }
      );

      throw new Error(`Failed to process plants: ${error.message}`);
    }
  }

  async getProcessingBatch(id: number): Promise<ProcessingBatch | null> {
    try {
      console.log(
        `\x1b[36m[ProcessingService]\x1b[0m Getting processing batch by ID: ${id}`
      );

      const batch = await this.processingBatchRepository.findOne({
        where: { id },
        relations: ["perfume"],
      });

      return batch;
    } catch (error: any) {
      console.error(
        `\x1b[31m[ProcessingService]\x1b[0m Failed to get processing batch ${id}:`,
        error
      );
      throw new Error(`Failed to get processing batch: ${error.message}`);
    }
  }

  async getAllProcessingBatches(filters?: {
    status?: string;
    perfumeType?: string;
  }): Promise<ProcessingBatch[]> {
    try {
      console.log("\x1b[36m[ProcessingService]\x1b[0m Getting all processing batches");

      let query = this.processingBatchRepository
        .createQueryBuilder("batch")
        .leftJoinAndSelect("batch.perfume", "perfume");

      if (filters?.status) {
        query = query.where("batch.status = :status", { status: filters.status });
      }

      if (filters?.perfumeType) {
        query = query.andWhere("perfume.type = :perfumeType", {
          perfumeType: filters.perfumeType,
        });
      }

      query = query.orderBy("batch.startedAt", "DESC");

      const batches = await query.getMany();
      return batches;
    } catch (error: any) {
      console.error(
        `\x1b[31m[ProcessingService]\x1b[0m Failed to get processing batches:`,
        error
      );
      throw new Error(`Failed to get processing batches: ${error.message}`);
    }
  }

  async cancelProcessingBatch(id: number, reason?: string): Promise<boolean> {
    try {
      console.log(
        `\x1b[36m[ProcessingService]\x1b[0m Canceling processing batch: ${id}`
      );

      // AUDIT: Log start
      await this.auditClient.logInfo(
        "PROCESSING",
        "CANCEL_PROCESSING_BATCH_STARTED",
        `Canceling processing batch: ${id}`,
        { batchId: id, reason, timestamp: new Date().toISOString() }
      );

      const batch = await this.getProcessingBatch(id);
      if (!batch) {
        // AUDIT: Log not found
        await this.auditClient.logWarning(
          "PROCESSING",
          "CANCEL_PROCESSING_BATCH_NOT_FOUND",
          `Processing batch not found: ${id}`,
          { batchId: id, timestamp: new Date().toISOString() }
        );
        return false;
      }

      if (batch.isCompleted()) {
        throw new Error("Cannot cancel a completed batch");
      }

      batch.markAsCancelled(reason);
      await this.processingBatchRepository.save(batch);

      // AUDIT: Log success
      await this.auditClient.logInfo(
        "PROCESSING",
        "CANCEL_PROCESSING_BATCH_SUCCESS",
        `Cancelled processing batch ${id}`,
        {
          batchId: id,
          reason: reason || "No reason provided",
          timestamp: new Date().toISOString(),
        }
      );

      return true;
    } catch (error: any) {
      console.error(
        `\x1b[31m[ProcessingService]\x1b[0m Failed to cancel processing batch:`,
        error
      );

      // AUDIT: Log error
      await this.auditClient.logError(
        "PROCESSING",
        "CANCEL_PROCESSING_BATCH_FAILED",
        error,
        { batchId: id, reason, timestamp: new Date().toISOString() }
      );

      return false;
    }
  }

  async createProcessingRequest(data: ProcessPlantsDTO): Promise<ProcessingRequest> {
    try {
      const plantsNeeded = Math.ceil((data.bottleCount * data.bottleSize) / 50);

      // AUDIT: Log start
      await this.auditClient.logInfo(
        "PROCESSING",
        "CREATE_PROCESSING_REQUEST_STARTED",
        `Creating processing request for ${data.bottleCount} bottles of ${data.perfumeType}`,
        { ...data, timestamp: new Date().toISOString() }
      );

      const request = new ProcessingRequest();
      request.perfumeType = data.perfumeType;
      request.bottleSize = data.bottleSize;
      request.bottleCount = data.bottleCount;
      request.plantsNeeded = plantsNeeded;
      request.status = ProcessingStatus.PENDING;
      request.requestSource = data.source;
      request.userId = data.userId;
      request.externalRequestId = data.externalRequestId;
      request.metadata = data.metadata;

      const savedRequest = await this.processingRequestRepository.save(request);

      // AUDIT: Log success
      await this.auditClient.logInfo(
        "PROCESSING",
        "CREATE_PROCESSING_REQUEST_SUCCESS",
        `Created processing request for ${data.bottleCount} bottles of ${data.perfumeType}`,
        {
          requestId: savedRequest.id,
          perfumeType: data.perfumeType,
          bottleCount: data.bottleCount,
          timestamp: new Date().toISOString(),
        }
      );

      return savedRequest;
    } catch (error: any) {
      console.error(
        `\x1b[31m[ProcessingService]\x1b[0m Failed to create processing request:`,
        error
      );

      // AUDIT: Log error
      await this.auditClient.logError(
        "PROCESSING",
        "CREATE_PROCESSING_REQUEST_FAILED",
        error,
        { ...data, timestamp: new Date().toISOString() }
      );

      throw new Error(`Failed to create processing request: ${error.message}`);
    }
  }

  async getProcessingRequests(filters?: {
    status?: string;
    source?: string;
  }): Promise<ProcessingRequest[]> {
    try {
      console.log("\x1b[36m[ProcessingService]\x1b[0m Getting processing requests");

      let query = this.processingRequestRepository.createQueryBuilder("request");

      if (filters?.status) {
        query = query.where("request.status = :status", { status: filters.status });
      }

      if (filters?.source) {
        query = query.andWhere("request.requestSource = :source", {
          source: filters.source,
        });
      }

      query = query.orderBy("request.createdAt", "DESC");

      const requests = await query.getMany();
      return requests;
    } catch (error: any) {
      console.error(
        `\x1b[31m[ProcessingService]\x1b[0m Failed to get processing requests:`,
        error
      );
      throw new Error(`Failed to get processing requests: ${error.message}`);
    }
  }

  async processPendingRequests(): Promise<number> {
    try {
      console.log("\x1b[36m[ProcessingService]\x1b[0m Processing pending requests");

      // AUDIT: Log start
      await this.auditClient.logInfo(
        "PROCESSING",
        "PROCESS_PENDING_REQUESTS_STARTED",
        "Starting to process pending requests",
        { timestamp: new Date().toISOString() }
      );

      const pendingRequests = await this.processingRequestRepository.find({
        where: { status: ProcessingStatus.PENDING },
      });

      let processedCount = 0;
      for (const request of pendingRequests) {
        try {
          const batchData: ProcessPlantsDTO = {
            perfumeType: request.perfumeType,
            bottleSize: request.bottleSize,
            bottleCount: request.bottleCount,
            source: request.requestSource as SourceType,
            externalRequestId: request.externalRequestId,
            userId: request.userId,
          };

          await this.processPlants(batchData);
          request.markAsProcessed();
          await this.processingRequestRepository.save(request);
          processedCount++;
        } catch (error) {
          console.error(
            `Failed to process request ${request.id}:`,
            error
          );
          request.markAsFailed((error as Error).message);
          await this.processingRequestRepository.save(request);
        }
      }

      // AUDIT: Log completion
      await this.auditClient.logInfo(
        "PROCESSING",
        "PROCESS_PENDING_REQUESTS_COMPLETED",
        `Processed ${processedCount} pending requests`,
        { processedCount, timestamp: new Date().toISOString() }
      );

      return processedCount;
    } catch (error: any) {
      console.error(
        `\x1b[31m[ProcessingService]\x1b[0m Failed to process pending requests:`,
        error
      );

      // AUDIT: Log error
      await this.auditClient.logError(
        "PROCESSING",
        "PROCESS_PENDING_REQUESTS_FAILED",
        error,
        { timestamp: new Date().toISOString() }
      );

      throw new Error(`Failed to process pending requests: ${error.message}`);
    }
  }

  async requestPerfumesForPackaging(data: PackagingRequestDTO): Promise<Packaging | null> {
    try {
      console.log(
        `\x1b[36m[ProcessingService]\x1b[0m Packaging request for: ${data.perfumeType}`
      );

      // AUDIT: Log start
      await this.auditClient.logInfo(
        "PROCESSING",
        "PACKAGING_REQUEST_STARTED",
        `Packaging request for: ${data.perfumeType}`,
        { ...data, timestamp: new Date().toISOString() }
      );

      // Find perfume
      const perfume = await this.getPerfumeByType(data.perfumeType);
      if (!perfume) {
        throw new Error(`Perfume type ${data.perfumeType} not found`);
      }

      // Check if specific bottle size is requested
      if (data.bottleSize && perfume.bottleSize !== data.bottleSize) {
        throw new Error(
          `Requested bottle size ${data.bottleSize} does not match perfume bottle size ${perfume.bottleSize}`
        );
      }

      // Check availability
      if (!perfume.hasEnoughQuantity(data.quantity)) {
        throw new Error(
          `Insufficient perfume. Available: ${perfume.getAvailableQuantity()}, Requested: ${data.quantity}`
        );
      }

      // Reserve perfume
      const reserved = perfume.reserveForPackaging(data.quantity);
      if (!reserved) {
        throw new Error("Failed to reserve perfume for packaging");
      }

      await this.perfumeRepository.save(perfume);

      // Create packaging record
      const packaging = new Packaging();
      packaging.perfume = perfume;
      packaging.perfumeId = perfume.id;
      packaging.quantity = data.quantity;
      packaging.status = PackagingStatus.RESERVED;
      packaging.warehouseLocation = data.destinationWarehouse;

      const savedPackaging = await this.packagingRepository.save(packaging);

      // AUDIT: Log success
      await this.auditClient.logInfo(
        "PROCESSING",
        "PACKAGING_REQUEST_SUCCESS",
        `Packaging created for ${data.quantity} bottles of ${data.perfumeType}`,
        {
          packagingId: savedPackaging.id,
          perfumeType: data.perfumeType,
          quantity: data.quantity,
          bottleSize: perfume.bottleSize,
          timestamp: new Date().toISOString(),
        }
      );

      console.log(
        `\x1b[32m[ProcessingService]\x1b[0m Packaging created for ${data.quantity} bottles of ${data.perfumeType}`
      );
      return savedPackaging;
    } catch (error: any) {
      console.error(
        `\x1b[31m[ProcessingService]\x1b[0m Failed to process packaging request:`,
        error
      );

      // AUDIT: Log error
      await this.auditClient.logError(
        "PROCESSING",
        "PACKAGING_REQUEST_FAILED",
        error,
        { ...data, timestamp: new Date().toISOString() }
      );

      throw new Error(`Failed to process packaging request: ${error.message}`);
    }
  }

  async getAvailablePackaging(): Promise<Packaging[]> {
    try {
      console.log("\x1b[36m[ProcessingService]\x1b[0m Getting available packaging");

      const packaging = await this.packagingRepository.find({
        where: { status: PackagingStatus.AVAILABLE },
        relations: ["perfume"],
      });

      return packaging;
    } catch (error: any) {
      console.error(
        `\x1b[31m[ProcessingService]\x1b[0m Failed to get available packaging:`,
        error
      );
      throw new Error(`Failed to get available packaging: ${error.message}`);
    }
  }

  async getPackagingById(id: number): Promise<Packaging | null> {
    try {
      console.log(
        `\x1b[36m[ProcessingService]\x1b[0m Getting packaging by ID: ${id}`
      );

      const packaging = await this.packagingRepository.findOne({
        where: { id },
        relations: ["perfume"],
      });

      return packaging;
    } catch (error: any) {
      console.error(
        `\x1b[31m[ProcessingService]\x1b[0m Failed to get packaging ${id}:`,
        error
      );
      throw new Error(`Failed to get packaging: ${error.message}`);
    }
  }

  async shipPackagingToWarehouse(
    packagingId: number,
    data: ShipPackagingDTO
  ): Promise<Packaging | null> {
    try {
      console.log(
        `\x1b[36m[ProcessingService]\x1b[0m Shipping packaging to warehouse: ${packagingId}`
      );

      // AUDIT: Log start
      await this.auditClient.logInfo(
        "PROCESSING",
        "SHIP_PACKAGING_STARTED",
        `Shipping packaging ${packagingId} to warehouse`,
        { packagingId, ...data, timestamp: new Date().toISOString() }
      );

      const packaging = await this.getPackagingById(packagingId);
      if (!packaging) {
        throw new Error(`Packaging ${packagingId} not found`);
      }

      if (packaging.isShipped()) {
        throw new Error(`Packaging ${packagingId} is already shipped`);
      }

      packaging.markAsShipped(data.warehouseLocation, data.trackingNumber);
      const shippedPackaging = await this.packagingRepository.save(packaging);

      // Release reserved perfume
      const perfume = await this.getPerfumeById(packaging.perfumeId);
      if (perfume) {
        perfume.releaseReserved(packaging.quantity);
        await this.perfumeRepository.save(perfume);
      }

      // AUDIT: Log success
      await this.auditClient.logInfo(
        "PROCESSING",
        "SHIP_PACKAGING_SUCCESS",
        `Shipped packaging ${packagingId} to warehouse ${data.warehouseLocation}`,
        {
          packagingId: packagingId,
          warehouseLocation: data.warehouseLocation,
          quantity: packaging.quantity,
          perfumeType: packaging.perfume?.type,
          timestamp: new Date().toISOString(),
        }
      );

      return shippedPackaging;
    } catch (error: any) {
      console.error(
        `\x1b[31m[ProcessingService]\x1b[0m Failed to ship packaging:`,
        error
      );

      // AUDIT: Log error
      await this.auditClient.logError(
        "PROCESSING",
        "SHIP_PACKAGING_FAILED",
        error,
        { packagingId, ...data, timestamp: new Date().toISOString() }
      );

      throw new Error(`Failed to ship packaging: ${error.message}`);
    }
  }

  async getPerfumeInventory(type?: string): Promise<
    Array<{
      type: string;
      available: number;
      reserved: number;
      total: number;
      bottleSize: number;
      totalVolumeMl: number;
    }>
  > {
    try {
      console.log("\x1b[36m[ProcessingService]\x1b[0m Getting perfume inventory");

      let query = this.perfumeRepository.createQueryBuilder("perfume");

      if (type) {
        query = query.where("perfume.type = :type", { type });
      }

      const perfumes = await query.getMany();

      return perfumes.map((p) => ({
        type: p.type,
        available: p.getAvailableQuantity(),
        reserved: p.reservedQuantity,
        total: p.quantity,
        bottleSize: p.bottleSize,
        totalVolumeMl: p.totalVolumeMl,
      }));
    } catch (error: any) {
      console.error(
        `\x1b[31m[ProcessingService]\x1b[0m Failed to get perfume inventory:`,
        error
      );
      throw new Error(`Failed to get perfume inventory: ${error.message}`);
    }
  }

  calculatePlantsNeeded(bottleCount: number, bottleSize: number): number {
    const totalMl = bottleCount * bottleSize;
    return Math.ceil(totalMl / 50); // 1 plant = 50ml
  }

  async getSystemStatus(): Promise<{
    totalPerfumes: number;
    totalBatches: number;
    pendingRequests: number;
    availablePackaging: number;
  }> {
    try {
      console.log("\x1b[36m[ProcessingService]\x1b[0m Getting system status");

      const totalPerfumes = await this.perfumeRepository.count();
      const totalBatches = await this.processingBatchRepository.count();
      const pendingRequests = await this.processingRequestRepository.count({
        where: { status: ProcessingStatus.PENDING },
      });
      const availablePackaging = await this.packagingRepository.count({
        where: { status: PackagingStatus.AVAILABLE },
      });

      return {
        totalPerfumes,
        totalBatches,
        pendingRequests,
        availablePackaging,
      };
    } catch (error: any) {
      console.error(
        `\x1b[31m[ProcessingService]\x1b[0m Failed to get system status:`,
        error
      );
      throw new Error(`Failed to get system status: ${error.message}`);
    }
  }

  // ===== PRODUCTION CLIENT INTEGRATION METHODS =====

  async checkPlantAvailability(
    perfumeType: string,
    bottleCount: number,
    bottleSize: number
  ): Promise<{
    available: boolean;
    plantsNeeded: number;
    availablePlants: number;
    message: string;
  }> {
    try {
      const plantsNeeded = this.calculatePlantsNeeded(bottleCount, bottleSize);
      
      // Call ProductionClient to get available plants
      const availablePlants = await this.productionClient.getAvailablePlants();
      
      if (!availablePlants.success || !availablePlants.data) {
        return {
          available: false,
          plantsNeeded,
          availablePlants: 0,
          message: "Failed to check plant availability"
        };
      }

      const matchingPlants = availablePlants.data.filter(
        (plant: any) => plant.plantType === perfumeType
      );

      const totalAvailable = matchingPlants.reduce((sum: number, plant: any) => sum + plant.quantity, 0);

      return {
        available: totalAvailable >= plantsNeeded,
        plantsNeeded,
        availablePlants: totalAvailable,
        message: totalAvailable >= plantsNeeded 
          ? `Sufficient plants available (${totalAvailable} available, ${plantsNeeded} needed)`
          : `Insufficient plants (${totalAvailable} available, ${plantsNeeded} needed)`
      };
    } catch (error: any) {
      console.error(
        `\x1b[31m[ProcessingService]\x1b[0m Failed to check plant availability:`,
        error
      );
      
      return {
        available: false,
        plantsNeeded: 0,
        availablePlants: 0,
        message: `Error checking availability: ${error.message}`
      };
    }
  }

  // ===== PRIVATE HELPER METHODS =====

  /**
   * Balansiranje jačine aromatičnih ulja
   * Ako je pređena granica od 4.00, zatraži novu biljku i smanji joj jačinu
   */
  private async balancePlantOilIntensity(
    processedPlantId: number,
    processedIntensity: number,
    userId: string
  ): Promise<void> {
    try {
      console.log(
        `\x1b[36m[ProcessingService]\x1b[0m Balancing plant oil intensity for plant ${processedPlantId}`
      );

      // AUDIT: Log start
      await this.auditClient.logInfo(
        "PROCESSING",
        "BALANCE_PLANT_INTENSITY_STARTED",
        `Balancing plant oil intensity for plant ${processedPlantId}`,
        {
          processedPlantId,
          processedIntensity,
          userId,
          timestamp: new Date().toISOString(),
        }
      );

      // 1. Request new plant for balancing via ProductionClient
      const newPlantResponse = await this.productionClient.requestNewPlantForProcessing(
        processedPlantId,
        processedIntensity
      );

      if (!newPlantResponse.success || !newPlantResponse.data) {
        throw new Error("Failed to create new plant for balancing");
      }

      const newPlant = newPlantResponse.data;
      
      // 2. Calculate how much to reduce (only decimal part)
      const excessIntensity = processedIntensity - 4.00; // 4.65 - 4.00 = 0.65
      const reductionPercentage = excessIntensity * 100; // 65%
      
      // 3. Change oil intensity for the new plant via ProductionClient
      const changeResult = await this.productionClient.changeOilIntensity(
        newPlant.id,
        -reductionPercentage, // negative percentage = reduction
        userId
      );

      if (!changeResult.success) {
        throw new Error(`Failed to balance plant oil intensity: ${changeResult.message}`);
      }

      // AUDIT: Log success
      await this.auditClient.logInfo(
        "PROCESSING",
        "BALANCE_PLANT_INTENSITY_SUCCESS",
        `Balanced plant intensity: ${processedIntensity} -> new plant adjusted by ${-reductionPercentage}%`,
        {
          processedPlantId,
          processedIntensity,
          newPlantId: newPlant.id,
          reductionPercentage: -reductionPercentage,
          newIntensity: changeResult.data?.oilIntensity,
          userId,
          timestamp: new Date().toISOString(),
        }
      );

      console.log(
        `\x1b[32m[ProcessingService]\x1b[0m Successfully balanced plant oil intensity`
      );

    } catch (error: any) {
      console.error(
        `\x1b[31m[ProcessingService]\x1b[0m Failed to balance plant intensity:`,
        error
      );
      
      // AUDIT: Log error
      await this.auditClient.logError(
        "PROCESSING",
        "BALANCE_PLANT_INTENSITY_FAILED",
        error,
        {
          processedPlantId,
          processedIntensity,
          userId,
          timestamp: new Date().toISOString(),
        }
      );
      
      throw error;
    }
  }

  private async simulateProcessing(batch: ProcessingBatch): Promise<void> {
    // Simulate processing time
    const processingTime = batch.bottleCount * 2000; // 2 seconds per bottle
    await new Promise((resolve) =>
      setTimeout(resolve, Math.min(processingTime, 30000))
    );

    // 5% chance of failure (for simulation)
    if (Math.random() < 0.05) {
      throw new Error("Processing failed: Equipment malfunction");
    }
  }

  private async createProcessingRequestRecord(
    data: ProcessPlantsDTO,
    plantsNeeded: number
  ): Promise<void> {
    const request = new ProcessingRequest();
    request.perfumeType = data.perfumeType;
    request.bottleSize = data.bottleSize;
    request.bottleCount = data.bottleCount;
    request.plantsNeeded = plantsNeeded;
    request.status = ProcessingStatus.COMPLETED;
    request.requestSource = data.source;
    request.userId = data.userId;
    request.externalRequestId = data.externalRequestId;
    request.processedAt = new Date();

    await this.processingRequestRepository.save(request);
  }
}