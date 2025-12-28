import { Request, Response, Router } from "express";
import { IProductionService } from "../../Domain/services/IProductionService";
import { CreatePlantDTO } from "../../Domain/DTOs/CreatePlantDTO";
import { UpdatePlantOilIntensityDTO } from "../../Domain/DTOs/UpdatePlantOilIntensityDTO";
import { HarvestPlantsDTO } from "../../Domain/DTOs/HarvestPlantsDTO";
import { ILogerService } from "../../Domain/services/ILogerService";
import {
  validateUpdateOilIntensity,
  validateRequestWithPlantId,
} from "../validators/PlantValidator";

export class ProductionController {
  private router: Router;
  private productionService: IProductionService;
  private readonly logerService: ILogerService;

  constructor(
    productionService: IProductionService,
    logerService: ILogerService
  ) {
    this.router = Router();
    this.productionService = productionService;
    this.logerService = logerService;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post("/plants", this.createPlant.bind(this));
    this.router.get("/plants", this.getAllPlants.bind(this));
    this.router.get("/plants/:id", this.getPlantById.bind(this));
    this.router.put(
      "/plants/:id/oil-intensity",
      this.changeOilIntensity.bind(this)
    );
    this.router.post("/plants/:id/harvest", this.harvestPlants.bind(this));
    this.router.get("/plants/available", this.getAvailablePlants.bind(this));
    this.router.get(
      "/plants/for-processing",
      this.getPlantsForProcessing.bind(this)
    );
    this.router.post(
      "/plants/request-for-processing",
      this.requestNewPlantForProcessing.bind(this)
    );
    this.router.get("/production-logs", this.getProductionLogs.bind(this));
    this.router.get("/plants/:id/logs", this.getPlantLogs.bind(this));
    this.router.get(
      "/plants/exceeding-threshold",
      this.getPlantsExceedingThreshold.bind(this)
    );
  }

  /**
   * POST /api/v1/plants
   * Creates a new plant
   */
  private async createPlant(req: Request, res: Response): Promise<void> {
    try {
      this.logerService.log("Create plant request received");

      const data: CreatePlantDTO = req.body as CreatePlantDTO;

      const plant = await this.productionService.createPlant(data);

      res.status(201).json({
        success: true,
        message: "Plant created successfully",
        data: plant,
      });
    } catch (error: any) {
      this.logerService.log(`Error creating plant: ${error}`);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to create plant",
      });
    }
  }

  /**
   * GET /api/v1/plants
   * Gets all plants
   */
  private async getAllPlants(req: Request, res: Response): Promise<void> {
    try {
      this.logerService.log("Get all plants request received");

      const plants = await this.productionService.getAllPlants();

      res.status(200).json({
        success: true,
        data: plants,
      });
    } catch (error: any) {
      this.logerService.log(`Error getting all plants: ${error}`);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch plants",
      });
    }
  }

  /**
   * GET /api/v1/plants/:id
   * Gets plant by ID
   */
  private async getPlantById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id);
      this.logerService.log(`Get plant by ID request received: ${id}`);

      if (isNaN(id) || id <= 0) {
        res.status(400).json({
          success: false,
          message: "Invalid plant ID",
        });
        return;
      }

      const plant = await this.productionService.getPlantById(id);

      if (plant) {
        res.status(200).json({
          success: true,
          data: plant,
        });
      } else {
        res.status(404).json({
          success: false,
          message: "Plant not found",
        });
      }
    } catch (error: any) {
      this.logerService.log(`Error getting plant by ID: ${error}`);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch plant",
      });
    }
  }

  /**
   * PUT /api/v1/plants/:id/oil-intensity
   * Changes oil intensity for a plant
   */
  private async changeOilIntensity(req: Request, res: Response): Promise<void> {
    try {
      const plantId = req.params.id;
      const { percentage, userId } = req.body;

      this.logerService.log(
        `Change oil intensity request received for plant: ${plantId}`
      );

      // Koristite novi validator
      const validation = validateRequestWithPlantId(
        plantId,
        { percentage, userId },
        validateUpdateOilIntensity
      );

      if (!validation.valid) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.errors,
        });
        return;
      }

      const data: UpdatePlantOilIntensityDTO = {
        percentage,
        userId,
      };

      // Sada možete koristiti validation.parsedId koji je siguran broj
      const plant = await this.productionService.changeOilIntensity(
        validation.parsedId!,
        data
      );

      if (plant) {
        const message =
          plant.oilIntensity > 4.0
            ? `Oil intensity changed successfully. WARNING: Intensity exceeded 4.00 threshold (current: ${plant.oilIntensity})`
            : "Oil intensity changed successfully";

        res.status(200).json({
          success: true,
          message,
          data: plant,
          thresholdExceeded: plant.oilIntensity > 4.0,
        });
      } else {
        res.status(404).json({
          success: false,
          message: "Plant not found",
        });
      }
    } catch (error: any) {
      this.logerService.log(`Error changing oil intensity: ${error.message}`);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to change oil intensity",
      });
    }
  }

  /**
   * POST /api/v1/plants/:id/harvest
   * Harvests plants
   */
  private async harvestPlants(req: Request, res: Response): Promise<void> {
    try {
      const plantId = parseInt(req.params.id);
      const { quantity, forProcessing, userId } = req.body;

      this.logerService.log(
        `Harvest plants request received for plant: ${plantId}`
      );

      if (isNaN(plantId) || plantId <= 0) {
        res.status(400).json({
          success: false,
          message: "Invalid plant ID",
        });
        return;
      }

      if (!quantity || quantity <= 0) {
        res.status(400).json({
          success: false,
          message: "Quantity must be greater than 0",
        });
        return;
      }

      const data: HarvestPlantsDTO = {
        quantity,
        forProcessing: forProcessing || false,
        userId,
      };

      const success = await this.productionService.harvestPlants(plantId, data);

      if (success) {
        const message = data.forProcessing
          ? `${quantity} plants harvested successfully for processing`
          : `${quantity} plants harvested successfully`;

        res.status(200).json({
          success: true,
          message,
        });
      } else {
        res.status(400).json({
          success: false,
          message:
            "Failed to harvest plants. Plant may not be available for harvest or insufficient quantity.",
        });
      }
    } catch (error: any) {
      this.logerService.log(`Error harvesting plants: ${error.message}`);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to harvest plants",
      });
    }
  }

  /**
   * GET /api/v1/plants/available
   * Gets available plants for harvest
   */
  private async getAvailablePlants(req: Request, res: Response): Promise<void> {
    try {
      this.logerService.log("Get available plants request received");

      const plants = await this.productionService.getAvailablePlants();

      res.status(200).json({
        success: true,
        data: plants,
      });
    } catch (error: any) {
      this.logerService.log(`Error getting available plants: ${error}`);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch available plants",
      });
    }
  }

  /**
   * GET /api/v1/plants/for-processing
   * Gets plants ready for processing
   */
  private async getPlantsForProcessing(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      this.logerService.log("Get plants for processing request received");

      const plants = await this.productionService.getPlantsForProcessing();

      res.status(200).json({
        success: true,
        data: plants,
      });
    } catch (error: any) {
      this.logerService.log(`Error getting plants for processing: ${error}`);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch plants for processing",
      });
    }
  }

  /**
   * POST /api/v1/plants/request-for-processing
   * Requests new plant for processing balance
   */
  private async requestNewPlantForProcessing(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const { processedPlantId, processedIntensity } = req.body;

      this.logerService.log("Request new plant for processing received");

      if (!processedPlantId || !processedIntensity) {
        res.status(400).json({
          success: false,
          message: "processedPlantId and processedIntensity are required",
        });
        return;
      }

      const plant = await this.productionService.requestNewPlantForProcessing(
        processedPlantId,
        processedIntensity
      );

      if (plant) {
        res.status(201).json({
          success: true,
          message: "New plant created for processing balance",
          data: plant,
        });
      } else {
        res.status(404).json({
          success: false,
          message: "Processed plant not found",
        });
      }
    } catch (error: any) {
      this.logerService.log(
        `Error requesting new plant for processing: ${error}`
      );
      res.status(400).json({
        success: false,
        message: error.message || "Failed to request new plant",
      });
    }
  }

  /**
   * GET /api/v1/production-logs
   * Gets all production logs
   */
  private async getProductionLogs(req: Request, res: Response): Promise<void> {
    try {
      this.logerService.log("Get production logs request received");

      const logs = await this.productionService.getProductionLogs();

      res.status(200).json({
        success: true,
        data: logs,
      });
    } catch (error: any) {
      this.logerService.log(`Error getting production logs: ${error}`);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch production logs",
      });
    }
  }

  /**
   * GET /api/v1/plants/:id/logs
   * Gets logs for specific plant
   */
  private async getPlantLogs(req: Request, res: Response): Promise<void> {
    try {
      const plantId = parseInt(req.params.id);
      this.logerService.log(
        `Get plant logs request received for plant: ${plantId}`
      );

      if (isNaN(plantId) || plantId <= 0) {
        res.status(400).json({
          success: false,
          message: "Invalid plant ID",
        });
        return;
      }

      const logs = await this.productionService.getLogsByPlantId(plantId);

      res.status(200).json({
        success: true,
        data: logs,
      });
    } catch (error: any) {
      this.logerService.log(`Error getting plant logs: ${error}`);
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch plant logs",
      });
    }
  }

  /**
   * GET /api/v1/plants/exceeding-threshold
   * Gets plants with oil intensity exceeding 4.00 threshold
   */
  private async getPlantsExceedingThreshold(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      this.logerService.log("Get plants exceeding threshold request received");

      const plants = await this.productionService.getPlantsExceedingThreshold();

      res.status(200).json({
        success: true,
        data: plants,
        count: plants.length,
        message:
          plants.length > 0
            ? `Found ${plants.length} plants exceeding 4.00 threshold`
            : "No plants exceeding 4.00 threshold",
      });
    } catch (error: any) {
      this.logerService.log(
        `Error getting plants exceeding threshold: ${error.message}`
      );
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch plants exceeding threshold",
      });
    }
  }

  public getRouter(): Router {
    return this.router;
  }
}
