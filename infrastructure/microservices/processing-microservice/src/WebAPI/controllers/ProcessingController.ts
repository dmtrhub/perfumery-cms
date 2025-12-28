import { Request, Response, Router } from "express";
import { IProcessingService } from "../../Domain/services/IProcessingService";
import { ILogerService } from "../../Domain/services/ILogerService";
import { CreatePerfumeDTO } from "../../Domain/DTOs/CreatePerfumeDTO";
import { ProcessPlantsDTO } from "../../Domain/DTOs/ProcessPlantsDTO";
import { GetPerfumesDTO } from "../../Domain/DTOs/GetPerfumesDTO";
import { PackagingRequestDTO } from "../../Domain/DTOs/PackagingRequestDTO";
import { ShipPackagingDTO } from "../../Domain/DTOs/ShipPackagingDTO";
import {
  validateCreatePerfume,
  validateProcessPlants,
  validatePackagingRequest,
  validateShipPackaging,
  validatePerfumeSearchParams,
  validateBatchSearchParams,
  validatePackagingSearchParams,
  validateIdParam,
  validateRequestWithId
} from "../validators/ProcessingValidator";

export class ProcessingController {
  private router: Router;
  private processingService: IProcessingService;
  private readonly logerService: ILogerService;

  constructor(processingService: IProcessingService, logerService: ILogerService) {
    this.router = Router();
    this.processingService = processingService;
    this.logerService = logerService;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Perfume management
    this.router.post('/perfumes', this.createPerfume.bind(this));
    this.router.get('/perfumes', this.getAllPerfumes.bind(this));
    this.router.get('/perfumes/:id', this.getPerfumeById.bind(this));
    this.router.get('/perfumes/type/:type', this.getPerfumeByType.bind(this));
    this.router.put('/perfumes/:id/quantity', this.updatePerfumeQuantity.bind(this));
    
    // Processing operations
    this.router.post('/process', this.processPlants.bind(this));
    this.router.get('/batches', this.getAllBatches.bind(this));
    this.router.get('/batches/:id', this.getBatchById.bind(this));
    this.router.post('/batches/:id/cancel', this.cancelBatch.bind(this));
    
    // Packaging operations
    this.router.post('/packaging/request', this.requestPerfumesForPackaging.bind(this));
    this.router.get('/packaging', this.getAllPackaging.bind(this));
    this.router.get('/packaging/available', this.getAvailablePackaging.bind(this));
    this.router.get('/packaging/:id', this.getPackagingById.bind(this));
    this.router.post('/packaging/:id/ship', this.shipPackagingToWarehouse.bind(this));
    
    // Processing requests
    this.router.post('/requests/process', this.createProcessingRequest.bind(this));
    this.router.get('/requests', this.getProcessingRequests.bind(this));
    this.router.post('/requests/process-pending', this.processPendingRequests.bind(this));
    
    // Inventory and system status
    this.router.get('/inventory', this.getPerfumeInventory.bind(this));
    this.router.get('/status', this.getSystemStatus.bind(this));
    this.router.get('/plants-needed', this.calculatePlantsNeeded.bind(this));
    
    // Processing logs
    this.router.get('/logs', this.getProcessingLogs.bind(this));
  }

  /**
   * POST /api/v1/perfumes
   * Creates a new perfume
   */
  private async createPerfume(req: Request, res: Response): Promise<void> {
    try {
      this.logerService.log("Create perfume request received");

      const validation = validateCreatePerfume(req.body);
      if (!validation.valid) {
        res.status(400).json({ 
          success: false, 
          message: "Validation failed",
          errors: validation.errors 
        });
        return;
      }

      const data: CreatePerfumeDTO = req.body;
      const perfume = await this.processingService.createPerfume(data);
      
      res.status(201).json({ 
        success: true, 
        message: "Perfume created successfully",
        data: perfume 
      });
    } catch (error: any) {
      this.logerService.log(`Error creating perfume: ${error.message}`);
      res.status(400).json({ 
        success: false, 
        message: error.message || "Failed to create perfume" 
      });
    }
  }

  /**
   * GET /api/v1/perfumes
   * Gets all perfumes with optional filters
   */
  private async getAllPerfumes(req: Request, res: Response): Promise<void> {
    try {
      this.logerService.log("Get all perfumes request received");

      // Validate query parameters
      const validation = validatePerfumeSearchParams(req.query);
      if (!validation.valid) {
        res.status(400).json({ 
          success: false, 
          message: "Validation failed",
          errors: validation.errors 
        });
        return;
      }

      const filters: GetPerfumesDTO = {
        type: validation.validatedParams.type,
        minQuantity: validation.validatedParams.minQuantity,
        bottleSize: validation.validatedParams.bottleSize
      };

      const perfumes = await this.processingService.getAllPerfumes(filters);
      
      res.status(200).json({ 
        success: true, 
        data: perfumes,
        count: perfumes.length
      });
    } catch (error: any) {
      this.logerService.log(`Error getting all perfumes: ${error.message}`);
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to fetch perfumes" 
      });
    }
  }

  /**
   * GET /api/v1/perfumes/:id
   * Gets perfume by ID
   */
  private async getPerfumeById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      this.logerService.log(`Get perfume by ID request received: ${id}`);

      const validation = validateIdParam(id);
      if (!validation.valid) {
        res.status(400).json({ 
          success: false, 
          message: "Validation failed",
          errors: validation.errors 
        });
        return;
      }

      const perfume = await this.processingService.getPerfumeById(validation.parsedId!);
      
      if (perfume) {
        res.status(200).json({ 
          success: true, 
          data: perfume 
        });
      } else {
        res.status(404).json({ 
          success: false, 
          message: "Perfume not found" 
        });
      }
    } catch (error: any) {
      this.logerService.log(`Error getting perfume by ID: ${error.message}`);
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to fetch perfume" 
      });
    }
  }

  /**
   * GET /api/v1/perfumes/type/:type
   * Gets perfume by type
   */
  private async getPerfumeByType(req: Request, res: Response): Promise<void> {
    try {
      const type = req.params.type;
      this.logerService.log(`Get perfume by type request received: ${type}`);

      const perfume = await this.processingService.getPerfumeByType(type);
      
      if (perfume) {
        res.status(200).json({ 
          success: true, 
          data: perfume 
        });
      } else {
        res.status(404).json({ 
          success: false, 
          message: "Perfume type not found" 
        });
      }
    } catch (error: any) {
      this.logerService.log(`Error getting perfume by type: ${error.message}`);
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to fetch perfume by type" 
      });
    }
  }

  /**
   * PUT /api/v1/perfumes/:id/quantity
   * Updates perfume quantity
   */
  private async updatePerfumeQuantity(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      const { quantity } = req.body;
      
      this.logerService.log(`Update perfume quantity request received for perfume: ${id}`);

      const validation = validateRequestWithId(
        id,
        { quantity },
        (data) => {
          const errors: string[] = [];
          if (!data.quantity || data.quantity < 0) {
            errors.push("Quantity must be a positive number");
          }
          if (data.quantity > 100000) {
            errors.push("Quantity cannot exceed 100000");
          }
          return { valid: errors.length === 0, errors: errors.length > 0 ? errors : undefined };
        }
      );

      if (!validation.valid) {
        res.status(400).json({ 
          success: false, 
          message: "Validation failed",
          errors: validation.errors 
        });
        return;
      }

      const perfume = await this.processingService.updatePerfumeQuantity(validation.parsedId!, quantity);
      
      if (perfume) {
        res.status(200).json({ 
          success: true, 
          message: "Perfume quantity updated successfully",
          data: perfume 
        });
      } else {
        res.status(404).json({ 
          success: false, 
          message: "Perfume not found" 
        });
      }
    } catch (error: any) {
      this.logerService.log(`Error updating perfume quantity: ${error.message}`);
      res.status(400).json({ 
        success: false, 
        message: error.message || "Failed to update perfume quantity" 
      });
    }
  }

  /**
   * POST /api/v1/process
   * Processes plants into perfume
   */
  private async processPlants(req: Request, res: Response): Promise<void> {
    try {
      this.logerService.log("Process plants request received");

      const validation = validateProcessPlants(req.body);
      if (!validation.valid) {
        res.status(400).json({ 
          success: false, 
          message: "Validation failed",
          errors: validation.errors 
        });
        return;
      }

      const data: ProcessPlantsDTO = req.body;
      const batch = await this.processingService.processPlants(data);
      
      res.status(201).json({ 
        success: true, 
        message: "Processing started successfully",
        data: batch,
        estimatedCompletion: new Date(Date.now() + batch.bottleCount * 2000) // 2 seconds per bottle
      });
    } catch (error: any) {
      this.logerService.log(`Error processing plants: ${error.message}`);
      res.status(400).json({ 
        success: false, 
        message: error.message || "Failed to process plants" 
      });
    }
  }

  /**
   * GET /api/v1/batches
   * Gets all processing batches with optional filters
   */
  private async getAllBatches(req: Request, res: Response): Promise<void> {
    try {
      this.logerService.log("Get all batches request received");

      const validation = validateBatchSearchParams(req.query);
      if (!validation.valid) {
        res.status(400).json({ 
          success: false, 
          message: "Validation failed",
          errors: validation.errors 
        });
        return;
      }

      const filters = {
        status: validation.validatedParams.status,
        perfumeType: validation.validatedParams.perfumeType,
        source: validation.validatedParams.source
      };

      const batches = await this.processingService.getAllProcessingBatches(filters);
      
      res.status(200).json({ 
        success: true, 
        data: batches,
        count: batches.length
      });
    } catch (error: any) {
      this.logerService.log(`Error getting all batches: ${error.message}`);
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to fetch processing batches" 
      });
    }
  }

  /**
   * GET /api/v1/batches/:id
   * Gets processing batch by ID
   */
  private async getBatchById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      this.logerService.log(`Get batch by ID request received: ${id}`);

      const validation = validateIdParam(id);
      if (!validation.valid) {
        res.status(400).json({ 
          success: false, 
          message: "Validation failed",
          errors: validation.errors 
        });
        return;
      }

      const batch = await this.processingService.getProcessingBatch(validation.parsedId!);
      
      if (batch) {
        res.status(200).json({ 
          success: true, 
          data: batch 
        });
      } else {
        res.status(404).json({ 
          success: false, 
          message: "Processing batch not found" 
        });
      }
    } catch (error: any) {
      this.logerService.log(`Error getting batch by ID: ${error.message}`);
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to fetch processing batch" 
      });
    }
  }

  /**
   * POST /api/v1/batches/:id/cancel
   * Cancels a processing batch
   */
  private async cancelBatch(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      const { reason } = req.body;
      
      this.logerService.log(`Cancel batch request received for batch: ${id}`);

      const validation = validateIdParam(id);
      if (!validation.valid) {
        res.status(400).json({ 
          success: false, 
          message: "Validation failed",
          errors: validation.errors 
        });
        return;
      }

      const success = await this.processingService.cancelProcessingBatch(validation.parsedId!, reason);
      
      if (success) {
        res.status(200).json({ 
          success: true, 
          message: reason ? `Batch cancelled: ${reason}` : "Batch cancelled successfully" 
        });
      } else {
        res.status(404).json({ 
          success: false, 
          message: "Batch not found or already completed" 
        });
      }
    } catch (error: any) {
      this.logerService.log(`Error cancelling batch: ${error.message}`);
      res.status(400).json({ 
        success: false, 
        message: error.message || "Failed to cancel batch" 
      });
    }
  }

  /**
   * POST /api/v1/packaging/request
   * Requests perfumes for packaging
   */
  private async requestPerfumesForPackaging(req: Request, res: Response): Promise<void> {
    try {
      this.logerService.log("Packaging request received");

      const validation = validatePackagingRequest(req.body);
      if (!validation.valid) {
        res.status(400).json({ 
          success: false, 
          message: "Validation failed",
          errors: validation.errors 
        });
        return;
      }

      const data: PackagingRequestDTO = req.body;
      const packaging = await this.processingService.requestPerfumesForPackaging(data);
      
      if (packaging) {
        res.status(201).json({ 
          success: true, 
          message: "Perfumes reserved for packaging",
          data: packaging 
        });
      } else {
        res.status(400).json({ 
          success: false, 
          message: "Failed to process packaging request" 
        });
      }
    } catch (error: any) {
      this.logerService.log(`Error processing packaging request: ${error.message}`);
      res.status(400).json({ 
        success: false, 
        message: error.message || "Failed to process packaging request" 
      });
    }
  }

  /**
   * GET /api/v1/packaging
   * Gets all packaging with optional filters
   */
  private async getAllPackaging(req: Request, res: Response): Promise<void> {
    try {
      this.logerService.log("Get all packaging request received");

      const validation = validatePackagingSearchParams(req.query);
      if (!validation.valid) {
        res.status(400).json({ 
          success: false, 
          message: "Validation failed",
          errors: validation.errors 
        });
        return;
      }

      // Since service doesn't have getAllPackaging with filters, we'll get all and filter manually
      const allPackaging = await this.processingService.getAvailablePackaging();
      
      let filteredPackaging = allPackaging;
      if (validation.validatedParams.status) {
        filteredPackaging = filteredPackaging.filter(p => p.status === validation.validatedParams.status);
      }
      if (validation.validatedParams.perfumeType) {
        filteredPackaging = filteredPackaging.filter(p => p.perfume?.type === validation.validatedParams.perfumeType);
      }
      if (validation.validatedParams.warehouseLocation) {
        filteredPackaging = filteredPackaging.filter(p => 
          p.warehouseLocation?.includes(validation.validatedParams.warehouseLocation!)
        );
      }
      if (validation.validatedParams.shippedOnly) {
        filteredPackaging = filteredPackaging.filter(p => p.status === 'SHIPPED' || p.status === 'DELIVERED');
      }
      
      res.status(200).json({ 
        success: true, 
        data: filteredPackaging,
        count: filteredPackaging.length
      });
    } catch (error: any) {
      this.logerService.log(`Error getting all packaging: ${error.message}`);
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to fetch packaging" 
      });
    }
  }

  /**
   * GET /api/v1/packaging/available
   * Gets available packaging
   */
  private async getAvailablePackaging(req: Request, res: Response): Promise<void> {
    try {
      this.logerService.log("Get available packaging request received");

      const packaging = await this.processingService.getAvailablePackaging();
      
      res.status(200).json({ 
        success: true, 
        data: packaging,
        count: packaging.length
      });
    } catch (error: any) {
      this.logerService.log(`Error getting available packaging: ${error.message}`);
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to fetch available packaging" 
      });
    }
  }

  /**
   * GET /api/v1/packaging/:id
   * Gets packaging by ID
   */
  private async getPackagingById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      this.logerService.log(`Get packaging by ID request received: ${id}`);

      const validation = validateIdParam(id);
      if (!validation.valid) {
        res.status(400).json({ 
          success: false, 
          message: "Validation failed",
          errors: validation.errors 
        });
        return;
      }

      const packaging = await this.processingService.getPackagingById(validation.parsedId!);
      
      if (packaging) {
        res.status(200).json({ 
          success: true, 
          data: packaging 
        });
      } else {
        res.status(404).json({ 
          success: false, 
          message: "Packaging not found" 
        });
      }
    } catch (error: any) {
      this.logerService.log(`Error getting packaging by ID: ${error.message}`);
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to fetch packaging" 
      });
    }
  }

  /**
   * POST /api/v1/packaging/:id/ship
   * Ships packaging to warehouse
   */
  private async shipPackagingToWarehouse(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      
      this.logerService.log(`Ship packaging request received for packaging: ${id}`);

      const validation = validateRequestWithId(
        id,
        req.body,
        validateShipPackaging
      );

      if (!validation.valid) {
        res.status(400).json({ 
          success: false, 
          message: "Validation failed",
          errors: validation.errors 
        });
        return;
      }

      const data: ShipPackagingDTO = req.body;
      const packaging = await this.processingService.shipPackagingToWarehouse(validation.parsedId!, data);
      
      if (packaging) {
        res.status(200).json({ 
          success: true, 
          message: "Packaging shipped to warehouse successfully",
          data: packaging 
        });
      } else {
        res.status(404).json({ 
          success: false, 
          message: "Packaging not found" 
        });
      }
    } catch (error: any) {
      this.logerService.log(`Error shipping packaging: ${error.message}`);
      res.status(400).json({ 
        success: false, 
        message: error.message || "Failed to ship packaging" 
      });
    }
  }

  /**
   * POST /api/v1/requests/process
   * Creates a processing request
   */
  private async createProcessingRequest(req: Request, res: Response): Promise<void> {
    try {
      this.logerService.log("Create processing request received");

      const validation = validateProcessPlants(req.body);
      if (!validation.valid) {
        res.status(400).json({ 
          success: false, 
          message: "Validation failed",
          errors: validation.errors 
        });
        return;
      }

      const data: ProcessPlantsDTO = req.body;
      const request = await this.processingService.createProcessingRequest(data);
      
      res.status(201).json({ 
        success: true, 
        message: "Processing request created successfully",
        data: request 
      });
    } catch (error: any) {
      this.logerService.log(`Error creating processing request: ${error.message}`);
      res.status(400).json({ 
        success: false, 
        message: error.message || "Failed to create processing request" 
      });
    }
  }

  /**
   * GET /api/v1/requests
   * Gets all processing requests with optional filters
   */
  private async getProcessingRequests(req: Request, res: Response): Promise<void> {
    try {
      this.logerService.log("Get processing requests request received");

      const { status, source } = req.query;
      
      const filters: any = {};
      if (status) filters.status = status as string;
      if (source) filters.source = source as string;

      const requests = await this.processingService.getProcessingRequests(filters);
      
      res.status(200).json({ 
        success: true, 
        data: requests,
        count: requests.length
      });
    } catch (error: any) {
      this.logerService.log(`Error getting processing requests: ${error.message}`);
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to fetch processing requests" 
      });
    }
  }

  /**
   * POST /api/v1/requests/process-pending
   * Processes all pending requests
   */
  private async processPendingRequests(req: Request, res: Response): Promise<void> {
    try {
      this.logerService.log("Process pending requests request received");

      const processedCount = await this.processingService.processPendingRequests();
      
      res.status(200).json({ 
        success: true, 
        message: `Successfully processed ${processedCount} pending requests`,
        processedCount 
      });
    } catch (error: any) {
      this.logerService.log(`Error processing pending requests: ${error.message}`);
      res.status(400).json({ 
        success: false, 
        message: error.message || "Failed to process pending requests" 
      });
    }
  }

  /**
   * GET /api/v1/inventory
   * Gets perfume inventory
   */
  private async getPerfumeInventory(req: Request, res: Response): Promise<void> {
    try {
      const type = req.query.type as string;
      this.logerService.log(`Get perfume inventory request received${type ? ` for type: ${type}` : ''}`);

      const inventory = await this.processingService.getPerfumeInventory(type);
      
      res.status(200).json({ 
        success: true, 
        data: inventory 
      });
    } catch (error: any) {
      this.logerService.log(`Error getting perfume inventory: ${error.message}`);
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to fetch perfume inventory" 
      });
    }
  }

  /**
   * GET /api/v1/status
   * Gets system status
   */
  private async getSystemStatus(req: Request, res: Response): Promise<void> {
    try {
      this.logerService.log("Get system status request received");

      const status = await this.processingService.getSystemStatus();
      
      res.status(200).json({ 
        success: true, 
        data: status 
      });
    } catch (error: any) {
      this.logerService.log(`Error getting system status: ${error.message}`);
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to fetch system status" 
      });
    }
  }

  /**
   * GET /api/v1/plants-needed
   * Calculates plants needed for given bottle count and size
   */
  private async calculatePlantsNeeded(req: Request, res: Response): Promise<void> {
    try {
      const { bottleCount, bottleSize } = req.query;
      
      this.logerService.log("Calculate plants needed request received");

      if (!bottleCount || !bottleSize) {
        res.status(400).json({ 
          success: false, 
          message: "bottleCount and bottleSize are required" 
        });
        return;
      }

      const count = parseInt(bottleCount as string);
      const size = parseInt(bottleSize as string);

      if (isNaN(count) || count <= 0) {
        res.status(400).json({ 
          success: false, 
          message: "bottleCount must be a positive number" 
        });
        return;
      }

      if (isNaN(size) || (size !== 150 && size !== 250)) {
        res.status(400).json({ 
          success: false, 
          message: "bottleSize must be either 150 or 250" 
        });
        return;
      }

      const plantsNeeded = this.processingService.calculatePlantsNeeded(count, size);
      const totalMl = count * size;
      
      res.status(200).json({ 
        success: true, 
        data: {
          bottleCount: count,
          bottleSize: size,
          totalMl,
          plantsNeeded,
          plantsPerBottle: plantsNeeded / count
        }
      });
    } catch (error: any) {
      this.logerService.log(`Error calculating plants needed: ${error.message}`);
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to calculate plants needed" 
      });
    }
  }

  /**
   * GET /api/v1/logs
   * Gets processing logs with optional filters
   */
  private async getProcessingLogs(req: Request, res: Response): Promise<void> {
    try {
      this.logerService.log("Get processing logs request received");

      // Note: This would require a separate service method for getting logs
      // For now, we'll return a placeholder response
      // In a real implementation, you would query an audit log table
      
      res.status(200).json({ 
        success: true, 
        message: "Logs endpoint - implementation pending",
        data: []
      });
    } catch (error: any) {
      this.logerService.log(`Error getting processing logs: ${error.message}`);
      res.status(500).json({ 
        success: false, 
        message: error.message || "Failed to fetch processing logs" 
      });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}