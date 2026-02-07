import { Router, Request, Response } from "express";
import { Repository } from "typeorm";
import { Plant } from "../../Domain/models/Plant";
import { PlantService } from "../../Services/PlantService";
import { IAuditClient } from "../../External/IAuditClient";
import { Logger } from "../../Infrastructure/Logger";
import { asyncHandler } from "../../Infrastructure/asyncHandler";
import { ValidatorMiddleware } from "../../Middlewares/ValidatorMiddleware";
import { CreatePlantDTO } from "../../Domain/DTOs/CreatePlantDTO";
import { HarvestPlantsDTO } from "../../Domain/DTOs/HarvestPlantsDTO";
import { AdjustOilIntensityDTO } from "../../Domain/DTOs/AdjustOilIntensityDTO";
import { FilterPlantsDTO } from "../../Domain/DTOs/FilterPlantsDTO";

/**
 * ProductionController
 * 
 * HTTP endpoints za proizvodnju biljaka
 */
export class ProductionController {
  private router: Router;
  private readonly logger: Logger;
  private readonly plantService: PlantService;

  constructor(
    plantRepository: Repository<Plant>,
    auditClient: IAuditClient
  ) {
    this.router = Router();
    this.logger = Logger.getInstance();
    this.plantService = new PlantService(plantRepository, auditClient);
    this.initializeRoutes();
  }

  /**
   * Inicijalizuj rute
   */
  private initializeRoutes(): void {
    this.router.post(
      "/plants",
      ValidatorMiddleware(CreatePlantDTO),
      asyncHandler(this.createPlant.bind(this))
    );

    this.router.get(
      "/plants",
      asyncHandler(this.getAllPlants.bind(this))
    );

    this.router.get(
      "/plants/:id",
      asyncHandler(this.getPlantById.bind(this))
    );

    this.router.put(
      "/plants/:id",
      ValidatorMiddleware(CreatePlantDTO),
      asyncHandler(this.updatePlant.bind(this))
    );

    this.router.delete(
      "/plants/:id",
      asyncHandler(this.deletePlant.bind(this))
    );

    this.router.post(
      "/plants/harvest",
      ValidatorMiddleware(HarvestPlantsDTO),
      asyncHandler(this.harvestPlants.bind(this))
    );

    this.router.patch(
      "/plants/:id/oil-strength",
      ValidatorMiddleware(AdjustOilIntensityDTO),
      asyncHandler(this.adjustOilStrength.bind(this))
    );

    this.router.get(
      "/plants/:id/balance",
      asyncHandler(this.checkBalance.bind(this))
    );

    this.router.patch(
      "/plants/mark-processed",
      asyncHandler(this.markAsProcessed.bind(this))
    );
  }

  /**
   * POST /api/v1/production/plants
   * Kreiraj novu biljku
   */
  private async createPlant(req: Request, res: Response): Promise<void> {
    this.logger.info("ProductionController", `🌱 POST /api/v1/production/plants`);

    const dto = req.body as CreatePlantDTO;
    const plant = await this.plantService.createPlant(dto);

    res.status(201).json({
      success: true,
      code: "PLANT_CREATED",
      data: plant.toJSON(),
      timestamp: new Date().toISOString()
    });
  }

  /**
   * GET /api/v1/production/plants
   * Dohvati sve biljke
   */
  private async getAllPlants(req: Request, res: Response): Promise<void> {
    this.logger.info("ProductionController", `📋 GET /api/v1/production/plants`);

    const filters: FilterPlantsDTO = {
      status: req.query.status as any,
      commonName: req.query.commonName as string
    };

    const plants = await this.plantService.getAllPlants(filters);

    res.status(200).json({
      success: true,
      code: "PLANTS_RETRIEVED",
      data: plants.map(p => p.toJSON()),
      count: plants.length,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * GET /api/v1/production/plants/:id
   * Dohvati biljku po ID-u
   */
  private async getPlantById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    this.logger.info("ProductionController", `📄 GET /api/v1/production/plants/${id}`);

    const plant = await this.plantService.getPlantById(id);

    res.status(200).json({
      success: true,
      code: "PLANT_RETRIEVED",
      data: plant.toJSON(),
      timestamp: new Date().toISOString()
    });
  }

  /**
   * PUT /api/v1/production/plants/:id
   * Ažuriraj biljku
   */
  private async updatePlant(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    this.logger.info("ProductionController", `✏️ PUT /api/v1/production/plants/${id}`);

    const dto = req.body as CreatePlantDTO;
    const plant = await this.plantService.updatePlant(id, dto);

    res.status(200).json({
      success: true,
      code: "PLANT_UPDATED",
      data: plant.toJSON(),
      timestamp: new Date().toISOString()
    });
  }

  /**
   * DELETE /api/v1/production/plants/:id
   * Obriši biljku
   */
  private async deletePlant(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    this.logger.info("ProductionController", `🗑️ DELETE /api/v1/production/plants/${id}`);

    await this.plantService.deletePlant(id);

    res.status(200).json({
      success: true,
      code: "PLANT_DELETED",
      message: `Plant ${id} successfully deleted`,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * POST /api/v1/production/plants/harvest
   * Uberi biljke
   */
  private async harvestPlants(req: Request, res: Response): Promise<void> {
    this.logger.info("ProductionController", `🌾 POST /api/v1/production/plants/harvest`);

    const dto = req.body as HarvestPlantsDTO;
    const plants = await this.plantService.harvestPlants(dto);

    res.status(200).json({
      success: true,
      code: "PLANTS_HARVESTED",
      data: plants.map(p => p.toJSON()),
      count: plants.length,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * PATCH /api/v1/production/plants/:id/oil-strength
   * Promeni jačinu ulja
   */
  private async adjustOilStrength(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    this.logger.info("ProductionController", `⚙️ PATCH /api/v1/production/plants/${id}/oil-strength`);

    const dto = req.body as AdjustOilIntensityDTO;
    const plant = await this.plantService.adjustOilStrength(id, dto.percentage);

    res.status(200).json({
      success: true,
      code: "OIL_STRENGTH_ADJUSTED",
      data: plant.toJSON(),
      timestamp: new Date().toISOString()
    });
  }

  /**
   * GET /api/v1/production/plants/:id/balance
   * Proveri balans jačine ulja
   */
  private async checkBalance(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    this.logger.info("ProductionController", `⚖️ GET /api/v1/production/plants/${id}/balance`);

    const plant = await this.plantService.getPlantById(id);
    const balance = await this.plantService.checkOilStrengthBalance(plant);

    res.status(200).json({
      success: true,
      code: "BALANCE_RETRIEVED",
      data: balance,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * PATCH /api/v1/production/plants/mark-processed
   * Označi biljke kao obrađene
   */
  private async markAsProcessed(req: Request, res: Response): Promise<void> {
    this.logger.info("ProductionController", `📌 PATCH /api/v1/production/plants/mark-processed`);

    const { plantIds } = req.body as { plantIds: string[] };

    if (!Array.isArray(plantIds) || plantIds.length === 0) {
      res.status(400).json({
        success: false,
        code: "INVALID_REQUEST",
        message: "plantIds must be a non-empty array",
        timestamp: new Date().toISOString()
      });
      return;
    }

    await this.plantService.markAsProcessed(plantIds);

    res.status(200).json({
      success: true,
      code: "PLANTS_MARKED_PROCESSED",
      message: `${plantIds.length} plants marked as processed`,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * Vrati router
   */
  getRouter(): Router {
    return this.router;
  }
}