import { Router, Request, Response } from "express";
import { Repository } from "typeorm";
import { Warehouse } from "../../Domain/models/Warehouse";
import { StoragePackaging } from "../../Domain/models/StoragePackaging";
import { WarehouseRepositoryService } from "../../Services/WarehouseRepositoryService";
import { PackagingRepositoryService } from "../../Services/PackagingRepositoryService";
import { IAuditClient } from "../../External/IAuditClient";
import { IProcessingClient } from "../../External/IProcessingClient";
import { Logger } from "../../Infrastructure/Logger";
import { asyncHandler } from "../../Infrastructure/asyncHandler";
import { ValidatorMiddleware } from "../../Middlewares/ValidatorMiddleware";
import { CreateWarehouseDTO } from "../../Domain/DTOs/CreateWarehouseDTO";
import { ReceivePackagingDTO } from "../../Domain/DTOs/ReceivePackagingDTO";
import { SendToSalesDTO } from "../../Domain/DTOs/SendToSalesDTO";

/**
 * StorageController
 * HTTP endpoints za skladištenje
 */
export class StorageController {
  private router: Router;
  private readonly logger: Logger;
  private readonly warehouseService: WarehouseRepositoryService;
  private readonly packagingService: PackagingRepositoryService;

  constructor(
    warehouseRepository: Repository<Warehouse>,
    packagingRepository: Repository<StoragePackaging>,
    auditClient: IAuditClient,
    processingClient: IProcessingClient
  ) {
    this.router = Router();
    this.logger = Logger.getInstance();
    this.warehouseService = new WarehouseRepositoryService(warehouseRepository, auditClient);
    this.packagingService = new PackagingRepositoryService(
      packagingRepository,
      warehouseRepository,
      auditClient,
      processingClient
    );
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Warehouse routes
    this.router.post(
      "/warehouses",
      ValidatorMiddleware(CreateWarehouseDTO),
      asyncHandler(this.createWarehouse.bind(this))
    );

    this.router.get(
      "/warehouses",
      asyncHandler(this.getAllWarehouses.bind(this))
    );

    this.router.get(
      "/warehouses/:id",
      asyncHandler(this.getWarehouseById.bind(this))
    );

    // Packaging routes
    this.router.post(
      "/receive",
      ValidatorMiddleware(ReceivePackagingDTO),
      asyncHandler(this.receivePackaging.bind(this))
    );

    this.router.post(
      "/send-to-sales",
      this.extractUserRole.bind(this),
      ValidatorMiddleware(SendToSalesDTO),
      asyncHandler(this.sendToSales.bind(this))
    );

    this.router.get(
      "/packagings",
      asyncHandler(this.getAllPackagings.bind(this))
    );

    this.router.get(
      "/packagings/:id",
      asyncHandler(this.getPackagingById.bind(this))
    );
  }

  /**
   * POST /api/v1/storage/warehouses
   */
  private async createWarehouse(req: Request, res: Response): Promise<void> {
    this.logger.info("StorageController", `🏭 POST /api/v1/storage/warehouses`);

    const dto = req.body as CreateWarehouseDTO;
    const warehouse = await this.warehouseService.createWarehouse(dto);

    res.status(201).json({
      success: true,
      code: "WAREHOUSE_CREATED",
      data: warehouse.toJSON(),
      timestamp: new Date().toISOString()
    });
  }

  /**
   * GET /api/v1/storage/warehouses
   */
  private async getAllWarehouses(req: Request, res: Response): Promise<void> {
    this.logger.info("StorageController", `📋 GET /api/v1/storage/warehouses`);

    const warehouses = await this.warehouseService.getAllWarehouses();

    res.status(200).json({
      success: true,
      code: "WAREHOUSES_RETRIEVED",
      data: warehouses.map(w => w.toJSON()),
      count: warehouses.length,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * GET /api/v1/storage/warehouses/:id
   */
  private async getWarehouseById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    this.logger.info("StorageController", `📄 GET /api/v1/storage/warehouses/${id}`);

    const warehouse = await this.warehouseService.getWarehouseById(id);

    res.status(200).json({
      success: true,
      code: "WAREHOUSE_RETRIEVED",
      data: warehouse.toJSON(),
      timestamp: new Date().toISOString()
    });
  }

  /**
   * POST /api/v1/storage/receive
   */
  private async receivePackaging(req: Request, res: Response): Promise<void> {
    this.logger.info("StorageController", `📦 POST /api/v1/storage/receive`);

    const { packagingId } = req.body as ReceivePackagingDTO;
    const packaging = await this.packagingService.receivePackaging(packagingId);

    res.status(201).json({
      success: true,
      code: "PACKAGING_RECEIVED",
      data: packaging.toJSON(),
      timestamp: new Date().toISOString()
    });
  }

  /**
   * POST /api/v1/storage/send-to-sales
   */
  private async sendToSales(req: Request, res: Response): Promise<void> {
    this.logger.info("StorageController", `📤 POST /api/v1/storage/send-to-sales`);

    try {
      const { count, userRole } = req.body as { count: number; userRole: string };
      
      this.logger.info("StorageController", `Sending ${count} packagings for role: ${userRole}`);
      
      const packagings = await this.packagingService.sendToSales(count, userRole);

      res.status(200).json({
        success: true,
        code: "PACKAGINGS_SENT_TO_SALES",
        message: `Uspešno poslano ${packagings.length} pakovanja u prodaju`,
        data: packagings.map(p => p.toJSON()),
        count: packagings.length,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      const message = error?.message || "Nepoznata greška";
      const isValidationError = message.includes("može zahtevati");
      
      if (isValidationError) {
        this.logger.warn("StorageController", `⚠️ Validation error: ${message}`);
        res.status(400).json({
          success: false,
          code: "VALIDATION_ERROR",
          message: message,
          statusCode: 400,
          timestamp: new Date().toISOString()
        });
      } else {
        this.logger.error("StorageController", `❌ Error sending packagings: ${message}`);
        res.status(500).json({
          success: false,
          code: "SEND_ERROR",
          message: message,
          statusCode: 500,
          timestamp: new Date().toISOString()
        });
      }
    }
  }

  /**
   * Middleware za ekstraktovanje uloge iz JWT tokena
   */
  private extractUserRole(req: Request, res: Response, next: Function): void {
    const authHeader = req.headers.authorization;
    const roleHeader = req.headers['x-user-role'] as string;

    try {
      let userRole: string | undefined;

      // Prvo pokušaj Bearer token
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        const parts = token.split('.');

        if (parts.length !== 3) {
          throw new Error("Invalid token format");
        }

        const decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        userRole = decoded.role || decoded.userRole;

        if (!userRole) {
          throw new Error("User role not found in token");
        }

        this.logger.debug("StorageController", `✅ Extracted role from JWT token: ${userRole}`);
      } 
      // Ako nema tokena, koristi X-User-Role header ako postoji
      else if (roleHeader) {
        userRole = roleHeader;
        this.logger.warn("StorageController", `⚠️ No Bearer token provided, using X-User-Role header: ${userRole}`);
      }
      // Ako nema ni tokena ni headera, vrati grešku
      else {
        res.status(401).json({
          success: false,
          code: "UNAUTHORIZED",
          message: "Authorization header with Bearer token or X-User-Role header is required",
          statusCode: 401,
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Dodaj ulogu u body za ValidatorMiddleware
      req.body.userRole = userRole;
      next();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Invalid token";
      this.logger.error("StorageController", `❌ Failed to extract role from JWT: ${message}`);

      res.status(401).json({
        success: false,
        code: "UNAUTHORIZED",
        message: `Invalid or expired token: ${message}`,
        statusCode: 401,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * GET /api/v1/storage/packagings
   */
  private async getAllPackagings(req: Request, res: Response): Promise<void> {
    this.logger.info("StorageController", `📋 GET /api/v1/storage/packagings`);

    const packagings = await this.packagingService.getAllPackagings();

    res.status(200).json({
      success: true,
      code: "PACKAGINGS_RETRIEVED",
      data: packagings.map(p => p.toJSON()),
      count: packagings.length,
      timestamp: new Date().toISOString()
    });
  }

  /**
   * GET /api/v1/storage/packagings/:id
   */
  private async getPackagingById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    this.logger.info("StorageController", `📄 GET /api/v1/storage/packagings/${id}`);

    const packaging = await this.packagingService.getPackagingById(id);

    res.status(200).json({
      success: true,
      code: "PACKAGING_RETRIEVED",
      data: packaging.toJSON(),
      timestamp: new Date().toISOString()
    });
  }

  /**
   * DEBUG: GET /api/v1/storage/debug/packagings-by-status/:status
   */
  private async getPackagingsByStatus(req: Request, res: Response): Promise<void> {
    const { status } = req.params;
    this.logger.info("StorageController", `🔍 DEBUG GET /debug/packagings-by-status/${status}`);

    try {
      const packagings = await (this.packagingService as any).packagingRepository?.find({
        where: { status: status.toUpperCase() },
        relations: ["warehouse"]
      });

      res.status(200).json({
        success: true,
        code: "DEBUG_PACKAGINGS_RETRIEVED",
        message: `Found ${packagings?.length || 0} packagings with status ${status}`,
        data: packagings?.map((p: any) => p.toJSON()) || [],
        count: packagings?.length || 0,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      this.logger.error("StorageController", `❌ Debug error: ${error instanceof Error ? error.message : 'Unknown'}`);
      res.status(500).json({
        success: false,
        code: "DEBUG_ERROR",
        message: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString()
      });
    }
  }

  getRouter(): Router {
    return this.router;
  }
}