import { Router, Request, Response } from "express";
import { Repository } from "typeorm";
import { Perfume } from "../../Domain/models/Perfume";
import { Packaging } from "../../Domain/models/Packaging";
import { ProcessingService } from "../../Services/ProcessingService";
import { IAuditClient } from "../../External/IAuditClient";
import { IProductionClient } from "../../External/IProductionClient";
import { IStorageClient } from "../../External/IStorageClient";
import { Logger } from "../../Infrastructure/Logger";
import { asyncHandler } from "../../Infrastructure/asyncHandler";
import { ValidatorMiddleware } from "../../Middlewares/ValidatorMiddleware";
import { StartProcessingDTO } from "../../Domain/DTOs/StartProcessingDTO";
import { CreatePackagingDTO } from "../../Domain/DTOs/CreatePackagingDTO";
import { SendPackagingDTO } from "../../Domain/DTOs/SendPackagingDTO";
import { FilterPerfumesDTO } from "../../Domain/DTOs/FilterPerfumesDTO";

/**
 * ProcessingController
 * HTTP endpoints za preradu parfema
 */
export class ProcessingController {
  private router: Router;
  private readonly logger: Logger;
  private readonly processingService: ProcessingService;

  constructor(
    perfumeRepository: Repository<Perfume>,
    packagingRepository: Repository<Packaging>,
    auditClient: IAuditClient,
    productionClient: IProductionClient,
    storageClient: IStorageClient
  ) {
    this.router = Router();
    this.logger = Logger.getInstance();
    this.processingService = new ProcessingService(
      perfumeRepository,
      packagingRepository,
      auditClient,
      productionClient,
      storageClient
    );
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Perfume routes
    this.router.post(
      "/start",
      ValidatorMiddleware(StartProcessingDTO),
      asyncHandler(this.startProcessing.bind(this))
    );

    this.router.get(
      "/perfumes",
      asyncHandler(this.getAllPerfumes.bind(this))
    );

    this.router.get(
      "/perfumes/:id",
      asyncHandler(this.getPerfumeById.bind(this))
    );

    // Packaging routes
    this.router.post(
      "/packaging",
      ValidatorMiddleware(CreatePackagingDTO),
      asyncHandler(this.createPackaging.bind(this))
    );

    this.router.get(
      "/packaging",
      asyncHandler(this.getAllPackagings.bind(this))
    );

    this.router.post(
      "/packaging/send",
      ValidatorMiddleware(SendPackagingDTO),
      asyncHandler(this.sendPackaging.bind(this))
    );

    this.router.get(
      "/packaging/:id",
      asyncHandler(this.getPackagingById.bind(this))
    );
  }

  /**
   * POST /api/v1/processing/start
   */
  private async startProcessing(req: Request, res: Response): Promise<void> {
    this.logger.info("ProcessingController", `🧪 POST /api/v1/processing/start`);

    const dto = req.body as StartProcessingDTO;
    const perfumes = await this.processingService.startProcessing(dto);

    res.status(201).json({
      success: true,
      code: "PROCESSING_STARTED",
      data: perfumes.map(p => p.toJSON()),
      count: perfumes.length,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * GET /api/v1/processing/perfumes
   */
  private async getAllPerfumes(req: Request, res: Response): Promise<void> {
    this.logger.info("ProcessingController", `📋 GET /api/v1/processing/perfumes`);

    const filters: FilterPerfumesDTO = {
      type: req.query.type as any,
      status: req.query.status as any
    };

    const perfumes = await this.processingService.getAllPerfumes(filters);

    res.status(200).json({
      success: true,
      code: "PERFUMES_RETRIEVED",
      data: perfumes.map(p => p.toJSON()),
      count: perfumes.length,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * GET /api/v1/processing/perfumes/:id
   */
  private async getPerfumeById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    this.logger.info("ProcessingController", `📄 GET /api/v1/processing/perfumes/${id}`);

    const perfume = await this.processingService.getPerfumeById(id);

    res.status(200).json({
      success: true,
      code: "PERFUME_RETRIEVED",
      data: perfume.toJSON(),
      timestamp: new Date().toISOString()
    });
  }

  /**
   * POST /api/v1/processing/packaging
   */
  private async createPackaging(req: Request, res: Response): Promise<void> {
    this.logger.info("ProcessingController", `📦 POST /api/v1/processing/packaging`);

    const dto = req.body as CreatePackagingDTO;
    const packaging = await this.processingService.createPackaging(dto);

    res.status(201).json({
      success: true,
      code: "PACKAGING_CREATED",
      data: packaging.toJSON(),
      timestamp: new Date().toISOString()
    });
  }

  /**
   * GET /api/v1/processing/packaging
   */
  private async getAllPackagings(req: Request, res: Response): Promise<void> {
    this.logger.info("ProcessingController", `📋 GET /api/v1/processing/packaging`);

    const packagings = await this.processingService.getAllPackagings();

    res.status(200).json({
      success: true,
      code: "PACKAGINGS_RETRIEVED",
      data: packagings.map(p => p.toJSON()),
      count: packagings.length,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * POST /api/v1/processing/packaging/send
   */
  private async sendPackaging(req: Request, res: Response): Promise<void> {
    this.logger.info("ProcessingController", `📤 POST /api/v1/processing/packaging/send`);

    const { packagingId } = req.body as SendPackagingDTO;
    const packaging = await this.processingService.sendPackaging(packagingId);

    res.status(200).json({
      success: true,
      code: "PACKAGING_SENT",
      data: packaging.toJSON(),
      timestamp: new Date().toISOString()
    });
  }

  /**
   * GET /api/v1/processing/packaging/:id
   */
  private async getPackagingById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    this.logger.info("ProcessingController", `📄 GET /api/v1/processing/packaging/${id}`);

    const packaging = await this.processingService.getPackagingById(id);

    res.status(200).json({
      success: true,
      code: "PACKAGING_RETRIEVED",
      data: packaging.toJSON(),
      timestamp: new Date().toISOString()
    });
  }

  getRouter(): Router {
    return this.router;
  }
}