import { Repository } from "typeorm";
import { Warehouse } from "../Domain/models/Warehouse";
import { StoragePackaging } from "../Domain/models/StoragePackaging";
import { IStorageService } from "../Domain/services/IStorageService";
import { IStorageStrategy } from "../Domain/services/IStorageStrategy";
import { CreateWarehouseDTO } from "../Domain/DTOs/CreateWarehouseDTO";
import { ReceivePackagingDTO } from "../Domain/DTOs/ReceivePackagingDTO";
import { ShipPackagingDTO } from "../Domain/DTOs/ShipPackagingDTO";
import { PackagingStatus } from "../Domain/enums/PackagingStatus";
import { AuditClient } from "../External/AuditClient";
import { DistributionCenterStrategy } from "./Strategies/DistributionCenterStrategy";
import { WarehouseCenterStrategy } from "./Strategies/WarehouseCenterStrategy";

export class StorageService implements IStorageService {
  private auditClient: AuditClient;

  constructor(
    private warehouseRepository: Repository<Warehouse>,
    private packagingRepository: Repository<StoragePackaging>
  ) {
    this.auditClient = new AuditClient();

    // AUDIT: Log service start
    this.auditClient
      .logInfo("STORAGE", "SERVICE_STARTED", "Storage Service started", {
        timestamp: new Date().toISOString(),
      })
      .catch(console.error);

    console.log("\x1b[36m[StorageService@1.0.0]\x1b[0m Service started");
  }

  // ===== WAREHOUSE MANAGEMENT =====

  async createWarehouse(data: CreateWarehouseDTO): Promise<Warehouse> {
    try {
      console.log(
        `\x1b[36m[StorageService]\x1b[0m Creating warehouse: ${data.name}`
      );

      // AUDIT: Log start
      await this.auditClient.logInfo(
        "STORAGE",
        "CREATE_WAREHOUSE_STARTED",
        `Creating new warehouse: ${data.name}`,
        { ...data, timestamp: new Date().toISOString() }
      );

      const warehouse = new Warehouse();
      warehouse.name = data.name;
      warehouse.location = data.location;
      warehouse.maxCapacity = data.maxCapacity;
      warehouse.type = data.type;
      warehouse.currentCapacity = 0;

      const savedWarehouse = await this.warehouseRepository.save(warehouse);

      // AUDIT: Log success
      await this.auditClient.logInfo(
        "STORAGE",
        "CREATE_WAREHOUSE_SUCCESS",
        `Warehouse created: ${data.name} (ID: ${savedWarehouse.id})`,
        {
          warehouseId: savedWarehouse.id,
          name: data.name,
          location: data.location,
          maxCapacity: data.maxCapacity,
          type: data.type,
          timestamp: new Date().toISOString(),
        }
      );

      console.log(
        `\x1b[32m[StorageService]\x1b[0m Warehouse created: ${data.name} (ID: ${savedWarehouse.id})`
      );
      return savedWarehouse;
    } catch (error: any) {
      console.error(
        `\x1b[31m[StorageService]\x1b[0m Failed to create warehouse:`,
        error
      );

      // AUDIT: Log error
      await this.auditClient.logError(
        "STORAGE",
        "CREATE_WAREHOUSE_FAILED",
        error,
        {
          warehouseName: data.name,
          ...data,
          timestamp: new Date().toISOString(),
        }
      );

      throw new Error(`Failed to create warehouse: ${error.message}`);
    }
  }

  async getAllWarehouses(): Promise<Warehouse[]> {
    try {
      console.log("\x1b[36m[StorageService]\x1b[0m Getting all warehouses");

      // AUDIT: Log start
      await this.auditClient.logInfo(
        "STORAGE",
        "GET_ALL_WAREHOUSES",
        "Retrieving all warehouses from database",
        { timestamp: new Date().toISOString() }
      );

      const warehouses = await this.warehouseRepository.find();
      const count = warehouses.length;

      // AUDIT: Log success
      await this.auditClient.logInfo(
        "STORAGE",
        "GET_ALL_WAREHOUSES_SUCCESS",
        `Retrieved ${count} warehouses from database`,
        { count, timestamp: new Date().toISOString() }
      );

      return warehouses;
    } catch (error: any) {
      console.error(
        `\x1b[31m[StorageService]\x1b[0m Failed to get all warehouses:`,
        error
      );

      // AUDIT: Log error
      await this.auditClient.logError(
        "STORAGE",
        "GET_ALL_WAREHOUSES_FAILED",
        error,
        { timestamp: new Date().toISOString() }
      );

      throw new Error(`Failed to get all warehouses: ${error.message}`);
    }
  }

  async getWarehouseById(id: number): Promise<Warehouse | null> {
    try {
      console.log(
        `\x1b[36m[StorageService]\x1b[0m Getting warehouse by ID: ${id}`
      );

      // AUDIT: Log start
      await this.auditClient.logInfo(
        "STORAGE",
        "GET_WAREHOUSE_BY_ID",
        `Retrieving warehouse with ID: ${id}`,
        { warehouseId: id, timestamp: new Date().toISOString() }
      );

      const warehouse = await this.warehouseRepository.findOne({
        where: { id },
      });

      if (warehouse) {
        // AUDIT: Log success
        await this.auditClient.logInfo(
          "STORAGE",
          "GET_WAREHOUSE_BY_ID_SUCCESS",
          `Found warehouse: ${warehouse.name} (ID: ${warehouse.id})`,
          {
            warehouseId: id,
            warehouseName: warehouse.name,
            timestamp: new Date().toISOString(),
          }
        );
        return warehouse;
      } else {
        // AUDIT: Log not found
        await this.auditClient.logWarning(
          "STORAGE",
          "GET_WAREHOUSE_BY_ID_NOT_FOUND",
          `Warehouse not found with ID: ${id}`,
          { warehouseId: id, timestamp: new Date().toISOString() }
        );
        return null;
      }
    } catch (error: any) {
      console.error(
        `\x1b[31m[StorageService]\x1b[0m Failed to get warehouse by ID ${id}:`,
        error
      );

      // AUDIT: Log error
      await this.auditClient.logError(
        "STORAGE",
        "GET_WAREHOUSE_BY_ID_FAILED",
        error,
        { warehouseId: id, timestamp: new Date().toISOString() }
      );

      throw new Error(`Failed to get warehouse by ID: ${error.message}`);
    }
  }

  // ===== PACKAGING MANAGEMENT =====

  async receivePackaging(data: ReceivePackagingDTO): Promise<StoragePackaging> {
    try {
      console.log(
        `\x1b[36m[StorageService]\x1b[0m Receiving packaging: ${data.processingPackagingId}`
      );

      // AUDIT: Log start
      await this.auditClient.logInfo(
        "STORAGE",
        "RECEIVE_PACKAGING_STARTED",
        `Receiving packaging from Processing: ${data.processingPackagingId}`,
        { ...data, timestamp: new Date().toISOString() }
      );

      // 1. Check if already exists
      const existing = await this.packagingRepository.findOne({
        where: { processingPackagingId: data.processingPackagingId },
      });

      if (existing) {
        throw new Error(
          `Packaging ${data.processingPackagingId} already received`
        );
      }

      // 2. Check warehouse capacity
      const warehouse = await this.getWarehouseById(
        data.destinationWarehouseId
      );
      if (!warehouse) {
        throw new Error(`Warehouse ${data.destinationWarehouseId} not found`);
      }

      if (warehouse.currentCapacity >= warehouse.maxCapacity) {
        throw new Error(
          `Warehouse ${warehouse.name} is at full capacity (${warehouse.currentCapacity}/${warehouse.maxCapacity})`
        );
      }

      // 3. Create storage packaging
      const packaging = new StoragePackaging();
      packaging.processingPackagingId = data.processingPackagingId;
      packaging.perfumeIds = data.perfumeIds;
      packaging.warehouse_id = data.destinationWarehouseId;
      packaging.status = PackagingStatus.IN_STORAGE;
      packaging.receivedAt = new Date();

      const savedPackaging = await this.packagingRepository.save(packaging);

      // 4. Update warehouse capacity
      warehouse.currentCapacity += 1;
      await this.warehouseRepository.save(warehouse);

      // 5. AUDIT: Log success
      await this.auditClient.logInfo(
        "STORAGE",
        "RECEIVE_PACKAGING_SUCCESS",
        `Packaging ${data.processingPackagingId} received and stored in warehouse ${warehouse.name}`,
        {
          processingPackagingId: data.processingPackagingId,
          storagePackagingId: savedPackaging.id,
          warehouseId: warehouse.id,
          warehouseName: warehouse.name,
          perfumeCount: data.perfumeIds.length,
          timestamp: new Date().toISOString(),
        }
      );

      console.log(
        `\x1b[32m[StorageService]\x1b[0m Packaging ${data.processingPackagingId} received successfully`
      );
      return savedPackaging;
    } catch (error: any) {
      console.error(
        `\x1b[31m[StorageService]\x1b[0m Failed to receive packaging:`,
        error
      );

      // AUDIT: Log error
      await this.auditClient.logError(
        "STORAGE",
        "RECEIVE_PACKAGING_FAILED",
        error,
        { ...data, timestamp: new Date().toISOString() }
      );

      throw new Error(`Failed to receive packaging: ${error.message}`);
    }
  }

  async getAllPackaging(): Promise<StoragePackaging[]> {
    try {
      console.log("\x1b[36m[StorageService]\x1b[0m Getting all packaging");

      const packaging = await this.packagingRepository.find({
        relations: ["warehouse"],
      });

      return packaging;
    } catch (error: any) {
      console.error(
        `\x1b[31m[StorageService]\x1b[0m Failed to get all packaging:`,
        error
      );
      throw new Error(`Failed to get all packaging: ${error.message}`);
    }
  }

  async getAvailablePackaging(
    perfumeType?: string
  ): Promise<StoragePackaging[]> {
    try {
      console.log(
        "\x1b[36m[StorageService]\x1b[0m Getting available packaging"
      );

      const packaging = await this.packagingRepository.find({
        where: { status: PackagingStatus.IN_STORAGE },
        relations: ["warehouse"],
      });

      return packaging;
    } catch (error: any) {
      console.error(
        `\x1b[31m[StorageService]\x1b[0m Failed to get available packaging:`,
        error
      );
      throw new Error(`Failed to get available packaging: ${error.message}`);
    }
  }

  async getPackagingById(id: number): Promise<StoragePackaging | null> {
    try {
      console.log(
        `\x1b[36m[StorageService]\x1b[0m Getting packaging by ID: ${id}`
      );

      const packaging = await this.packagingRepository.findOne({
        where: { id },
        relations: ["warehouse"],
      });

      return packaging;
    } catch (error: any) {
      console.error(
        `\x1b[31m[StorageService]\x1b[0m Failed to get packaging ${id}:`,
        error
      );
      throw new Error(`Failed to get packaging: ${error.message}`);
    }
  }

  // ===== SHIPPING OPERATIONS =====

  async shipToSales(data: ShipPackagingDTO): Promise<StoragePackaging[]> {
    try {
      console.log(
        `\x1b[36m[StorageService]\x1b[0m Shipping ${data.packagingIds.length} packages to Sales`
      );

      // AUDIT: Log start
      await this.auditClient.logInfo(
        "STORAGE",
        "SHIP_TO_SALES_STARTED",
        `Shipping ${data.packagingIds.length} packages to Sales service`,
        {
          packagingIds: data.packagingIds,
          userRole: data.userRole,
          userId: data.userId,
          timestamp: new Date().toISOString(),
        }
      );

      // 1. Choose strategy
      let shippingStrategy: IStorageStrategy;

      if (data.userRole === "MANAGER") {
        shippingStrategy = new DistributionCenterStrategy();
      } else if (data.userRole === "SELLER") {
        shippingStrategy = new WarehouseCenterStrategy();
      } else {
        throw new Error(`Unauthorized role for shipping: ${data.userRole}`);
      }

      // 2. Find packages
      const packages = await this.packagingRepository.findByIds(
        data.packagingIds
      );

      for (const pkg of packages) {
        await this.packagingRepository
          .createQueryBuilder("packaging")
          .leftJoinAndSelect("packaging.warehouse", "warehouse")
          .where("packaging.id = :id", { id: pkg.id })
          .getOne();
      }

      if (packages.length !== data.packagingIds.length) {
        const foundIds = packages.map((p) => p.id);
        const missingIds = data.packagingIds.filter(
          (id) => !foundIds.includes(id)
        );
        throw new Error(`Some packages not found: ${missingIds.join(", ")}`);
      }

      // 3. Check availability
      const unavailable = packages.filter((p) => !p.isAvailable());
      if (unavailable.length > 0) {
        throw new Error(
          `Packages not available for shipping: ${unavailable
            .map((p) => `ID: ${p.id} (Status: ${p.status})`)
            .join(", ")}`
        );
      }

      // 4. Use strategy to ship
      const shippingResult = await shippingStrategy.shipPackages(packages);

      // 5. Update package status
      packages.forEach((pkg) => {
        pkg.markAsShipped();
        pkg.shippedAt = new Date();
      });

      await this.packagingRepository.save(packages);

      // 6. Update warehouse capacities
      for (const pkg of packages) {
        const warehouse = pkg.warehouse;
        if (warehouse) {
          warehouse.currentCapacity -= 1;
          await this.warehouseRepository.save(warehouse);
        }
      }

      // 7. AUDIT: Log success
      await this.auditClient.logInfo(
        "STORAGE",
        "SHIP_TO_SALES_SUCCESS",
        `Successfully shipped ${packages.length} packages to Sales`,
        {
          shippedCount: packages.length,
          packagingIds: packages.map((p) => p.id),
          strategy: shippingStrategy.constructor.name,
          shippingResult,
          userId: data.userId,
          userRole: data.userRole,
          timestamp: new Date().toISOString(),
        }
      );

      console.log(
        `\x1b[32m[StorageService]\x1b[0m Successfully shipped ${packages.length} packages using ${shippingStrategy.constructor.name}`
      );
      return packages;
    } catch (error: any) {
      console.error(
        `\x1b[31m[StorageService]\x1b[0m Failed to ship packages:`,
        error
      );

      // AUDIT: Log error
      await this.auditClient.logError(
        "STORAGE",
        "SHIP_TO_SALES_FAILED",
        error,
        {
          packagingIds: data.packagingIds,
          userRole: data.userRole,
          userId: data.userId,
          timestamp: new Date().toISOString(),
        }
      );

      throw new Error(`Failed to ship packages: ${error.message}`);
    }
  }

  // ===== CAPACITY MANAGEMENT =====

  async checkWarehouseCapacity(warehouseId: number): Promise<{
    max: number;
    current: number;
    available: number;
    percentage: number;
  }> {
    try {
      const warehouse = await this.getWarehouseById(warehouseId);
      if (!warehouse) {
        throw new Error(`Warehouse ${warehouseId} not found`);
      }

      const percentage =
        (warehouse.currentCapacity / warehouse.maxCapacity) * 100;

      return {
        max: warehouse.maxCapacity,
        current: warehouse.currentCapacity,
        available: warehouse.maxCapacity - warehouse.currentCapacity,
        percentage: parseFloat(percentage.toFixed(2)),
      };
    } catch (error: any) {
      console.error(
        `\x1b[31m[StorageService]\x1b[0m Failed to check capacity:`,
        error
      );
      throw new Error(`Failed to check warehouse capacity: ${error.message}`);
    }
  }

  // ===== SYSTEM STATUS =====

  async getSystemStatus(): Promise<{
    totalWarehouses: number;
    totalPackaging: number;
    availablePackaging: number;
    reservedPackaging: number;
  }> {
    try {
      console.log("\x1b[36m[StorageService]\x1b[0m Getting system status");

      const totalWarehouses = await this.warehouseRepository.count();
      const totalPackaging = await this.packagingRepository.count();
      const availablePackaging = await this.packagingRepository.count({
        where: { status: PackagingStatus.IN_STORAGE },
      });
      const reservedPackaging = await this.packagingRepository.count({
        where: { status: PackagingStatus.RESERVED },
      });

      return {
        totalWarehouses,
        totalPackaging,
        availablePackaging,
        reservedPackaging,
      };
    } catch (error: any) {
      console.error(
        `\x1b[31m[StorageService]\x1b[0m Failed to get system status:`,
        error
      );
      throw new Error(`Failed to get system status: ${error.message}`);
    }
  }

  // ===== HELPER METHODS =====

  async findPackagingByPerfumeIds(
    perfumeIds: number[]
  ): Promise<StoragePackaging[]> {
    try {
      const allPackaging = await this.packagingRepository.find({
        where: { status: PackagingStatus.IN_STORAGE },
      });

      return allPackaging.filter((pkg) =>
        perfumeIds.some((id) => pkg.perfumeIds.includes(id))
      );
    } catch (error: any) {
      console.error(
        `\x1b[31m[StorageService]\x1b[0m Failed to find packaging by perfume IDs:`,
        error
      );
      throw new Error(`Failed to find packaging: ${error.message}`);
    }
  }
}
