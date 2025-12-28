import { Request, Response, Router } from "express";
import { IStorageService } from "../../Domain/services/IStorageService";
import { ILogerService } from "../../Domain/services/ILogerService";
import { CreateWarehouseDTO } from "../../Domain/DTOs/CreateWarehouseDTO";
import { ReceivePackagingDTO } from "../../Domain/DTOs/ReceivePackagingDTO";
import { ShipPackagingDTO } from "../../Domain/DTOs/ShipPackagingDTO";
import {
  validateCreateWarehouse,
  validateReceivePackaging,
  validateShipPackaging,
  validateIdParam,
  validatePackagingSearchParams,
} from "../validators/StorageValidator";

export class StorageController {
  private router: Router;

  constructor(
    private storageService: IStorageService,
    private loggerService: ILogerService
  ) {
    this.router = Router();
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // Warehouse management
    this.router.post("/warehouses", this.createWarehouse.bind(this));
    this.router.get("/warehouses", this.getAllWarehouses.bind(this));
    this.router.get("/warehouses/:id", this.getWarehouseById.bind(this));
    this.router.get(
      "/warehouses/:id/capacity",
      this.getWarehouseCapacity.bind(this)
    );

    // Packaging management
    this.router.post("/packaging/receive", this.receivePackaging.bind(this));
    this.router.get("/packaging", this.getAllPackaging.bind(this));
    this.router.get(
      "/packaging/available",
      this.getAvailablePackaging.bind(this)
    );
    this.router.get("/packaging/:id", this.getPackagingById.bind(this));

    // Shipping operations
    this.router.post("/packaging/ship", this.shipToSales.bind(this));

    // System status
    this.router.get("/status", this.getSystemStatus.bind(this));

    // Health check
    this.router.get("/health", this.healthCheck.bind(this));
  }

  private async createWarehouse(req: Request, res: Response): Promise<void> {
    try {
      await this.loggerService.log("Create warehouse request received");

      const validation = validateCreateWarehouse(req.body);
      if (!validation.valid) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.errors,
        });
        return;
      }

      const data: CreateWarehouseDTO = req.body;
      const warehouse = await this.storageService.createWarehouse(data);

      res.status(201).json({
        success: true,
        message: "Warehouse created successfully",
        data: warehouse,
      });
    } catch (error: any) {
      await this.loggerService.log(
        `Error creating warehouse: ${error.message}`
      );
      res.status(400).json({
        success: false,
        message: error.message || "Failed to create warehouse",
      });
    }
  }

  private async getAllWarehouses(req: Request, res: Response): Promise<void> {
    try {
      await this.loggerService.log("Get all warehouses request received");

      const warehouses = await this.storageService.getAllWarehouses();

      res.status(200).json({
        success: true,
        data: warehouses,
        count: warehouses.length,
      });
    } catch (error: any) {
      await this.loggerService.log(
        `Error getting all warehouses: ${error.message}`
      );
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch warehouses",
      });
    }
  }

  private async getWarehouseById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      await this.loggerService.log(
        `Get warehouse by ID request received: ${id}`
      );

      const validation = validateIdParam(id);
      if (!validation.valid) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.errors,
        });
        return;
      }

      const warehouse = await this.storageService.getWarehouseById(
        validation.parsedId!
      );

      if (warehouse) {
        res.status(200).json({
          success: true,
          data: warehouse,
        });
      } else {
        res.status(404).json({
          success: false,
          message: "Warehouse not found",
        });
      }
    } catch (error: any) {
      await this.loggerService.log(
        `Error getting warehouse by ID: ${error.message}`
      );
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch warehouse",
      });
    }
  }

  private async receivePackaging(req: Request, res: Response): Promise<void> {
    try {
      await this.loggerService.log("Receive packaging request received");

      const validation = validateReceivePackaging(req.body);
      if (!validation.valid) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.errors,
        });
        return;
      }

      const data: ReceivePackagingDTO = req.body;
      const packaging = await this.storageService.receivePackaging(data);

      res.status(201).json({
        success: true,
        message: "Packaging received successfully",
        data: packaging,
      });
    } catch (error: any) {
      await this.loggerService.log(
        `Error receiving packaging: ${error.message}`
      );
      res.status(400).json({
        success: false,
        message: error.message || "Failed to receive packaging",
      });
    }
  }

  // DODATA METODA: Get all packaging
  private async getAllPackaging(req: Request, res: Response): Promise<void> {
    try {
      await this.loggerService.log("Get all packaging request received");

      const validation = validatePackagingSearchParams(req.query);
      if (!validation.valid) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.errors,
        });
        return;
      }

      const packaging = await this.storageService.getAllPackaging();

      // Filtriranje po statusu ako je prosleđen
      let filteredPackaging = packaging;
      if (validation.validatedParams?.status) {
        filteredPackaging = filteredPackaging.filter(
          (p) => p.status === validation.validatedParams!.status
        );
      }

      // Filtriranje po warehouseId ako je prosleđen
      if (validation.validatedParams?.warehouseId) {
        filteredPackaging = filteredPackaging.filter(
          (p) => p.warehouse_id === validation.validatedParams!.warehouseId
        );
      }

      // Paginacija
      const limit = validation.validatedParams?.limit || 50;
      const offset = validation.validatedParams?.offset || 0;
      const paginatedPackaging = filteredPackaging.slice(
        offset,
        offset + limit
      );

      res.status(200).json({
        success: true,
        data: paginatedPackaging,
        pagination: {
          total: filteredPackaging.length,
          limit,
          offset,
          hasMore: offset + limit < filteredPackaging.length,
        },
      });
    } catch (error: any) {
      await this.loggerService.log(
        `Error getting all packaging: ${error.message}`
      );
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch packaging",
      });
    }
  }

  // DODATA METODA: Get available packaging
  private async getAvailablePackaging(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      await this.loggerService.log("Get available packaging request received");

      const packaging = await this.storageService.getAvailablePackaging();

      res.status(200).json({
        success: true,
        data: packaging,
        count: packaging.length,
      });
    } catch (error: any) {
      await this.loggerService.log(
        `Error getting available packaging: ${error.message}`
      );
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch available packaging",
      });
    }
  }

  // DODATA METODA: Get packaging by ID
  private async getPackagingById(req: Request, res: Response): Promise<void> {
    try {
      const id = req.params.id;
      await this.loggerService.log(
        `Get packaging by ID request received: ${id}`
      );

      const validation = validateIdParam(id);
      if (!validation.valid) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.errors,
        });
        return;
      }

      const packaging = await this.storageService.getPackagingById(
        validation.parsedId!
      );

      if (packaging) {
        res.status(200).json({
          success: true,
          data: packaging,
        });
      } else {
        res.status(404).json({
          success: false,
          message: "Packaging not found",
        });
      }
    } catch (error: any) {
      await this.loggerService.log(
        `Error getting packaging by ID: ${error.message}`
      );
      res.status(500).json({
        success: false,
        message: error.message || "Failed to fetch packaging",
      });
    }
  }

  private async shipToSales(req: Request, res: Response): Promise<void> {
    try {
      await this.loggerService.log("Ship to sales request received");

      const validation = validateShipPackaging(req.body);
      if (!validation.valid) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.errors,
        });
        return;
      }

      const data: ShipPackagingDTO = req.body;
      const shippedPackages = await this.storageService.shipToSales(data);

      res.status(200).json({
        success: true,
        message: `Successfully shipped ${shippedPackages.length} packages to Sales`,
        data: shippedPackages,
      });
    } catch (error: any) {
      await this.loggerService.log(`Error shipping to sales: ${error.message}`);
      res.status(400).json({
        success: false,
        message: error.message || "Failed to ship packages",
      });
    }
  }

  private async getWarehouseCapacity(
    req: Request,
    res: Response
  ): Promise<void> {
    try {
      const id = req.params.id;
      await this.loggerService.log(`Get warehouse capacity request: ${id}`);

      const validation = validateIdParam(id);
      if (!validation.valid) {
        res.status(400).json({
          success: false,
          message: "Validation failed",
          errors: validation.errors,
        });
        return;
      }

      const capacity = await this.storageService.checkWarehouseCapacity(
        validation.parsedId!
      );

      res.status(200).json({
        success: true,
        data: capacity,
      });
    } catch (error: any) {
      await this.loggerService.log(
        `Error getting warehouse capacity: ${error.message}`
      );
      res.status(400).json({
        success: false,
        message: error.message || "Failed to get capacity",
      });
    }
  }

  private async getSystemStatus(req: Request, res: Response): Promise<void> {
    try {
      await this.loggerService.log("Get system status request received");

      const status = await this.storageService.getSystemStatus();

      res.status(200).json({
        success: true,
        data: status,
      });
    } catch (error: any) {
      await this.loggerService.log(
        `Error getting system status: ${error.message}`
      );
      res.status(500).json({
        success: false,
        message: error.message || "Failed to get system status",
      });
    }
  }

  private healthCheck(req: Request, res: Response): void {
    res.status(200).json({
      status: "OK",
      service: "Storage Service",
      timestamp: new Date().toISOString(),
      version: "1.0.0",
    });
  }

  public getRouter(): Router {
    return this.router;
  }
}
