import { Repository } from "typeorm";
import { Warehouse } from "../Domain/models/Warehouse";
import { CreateWarehouseDTO } from "../Domain/DTOs/CreateWarehouseDTO";
import { Logger } from "../Infrastructure/Logger";
import { ResourceNotFoundException } from "../Domain/exceptions/ResourceNotFoundException";
import { IAuditClient } from "../External/IAuditClient";

/**
 * WarehouseRepositoryService
 * Servis za rad sa skladištima
 */
export class WarehouseRepositoryService {
  private readonly logger: Logger;

  constructor(
    private readonly warehouseRepository: Repository<Warehouse>,
    private readonly auditClient: IAuditClient
  ) {
    this.logger = Logger.getInstance();
  }

  /**
   * Kreiraj skladište
   */
  async createWarehouse(dto: CreateWarehouseDTO): Promise<Warehouse> {
    try {
      this.logger.debug("WarehouseRepositoryService", `Creating warehouse: ${dto.name}`);

      const warehouse = this.warehouseRepository.create({
        name: dto.name,
        location: dto.location,
        maxCapacity: dto.maxCapacity,
        type: dto.type
      });

      const saved = await this.warehouseRepository.save(warehouse);

      await this.auditClient.logInfo(
        "STORAGE",
        `Warehouse created: ${saved.name} (${saved.type}) with capacity ${saved.maxCapacity}`
      );

      this.logger.info("WarehouseRepositoryService", `✅ Warehouse created: ${saved.id}`);

      return saved;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error("WarehouseRepositoryService", `❌ Failed to create warehouse: ${message}`);
      await this.auditClient.logError("STORAGE", `Failed to create warehouse: ${message}`);
      throw error;
    }
  }

  /**
   * Dohvati skladište po ID-u
   */
  async getWarehouseById(id: string): Promise<Warehouse> {
    try {
      this.logger.debug("WarehouseRepositoryService", `Fetching warehouse: ${id}`);

      const warehouse = await this.warehouseRepository.findOne({
        where: { id },
        relations: ["packagings"]
      });

      if (!warehouse) {
        throw new ResourceNotFoundException(`Warehouse with ID ${id} not found`);
      }

      await this.auditClient.logInfo("STORAGE", `Fetched warehouse: ${warehouse.name}`);
      return warehouse;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error("WarehouseRepositoryService", `❌ Failed to fetch warehouse: ${message}`);
      throw error;
    }
  }

  /**
   * Dohvati sva skladišta
   */
  async getAllWarehouses(): Promise<Warehouse[]> {
    try {
      this.logger.debug("WarehouseRepositoryService", `Fetching all warehouses`);

      const warehouses = await this.warehouseRepository.find({
        relations: ["packagings"],
        order: { createdAt: "DESC" }
      });

      this.logger.info("WarehouseRepositoryService", `✅ Fetched ${warehouses.length} warehouses`);
      await this.auditClient.logInfo("STORAGE", `Fetched ${warehouses.length} warehouses`);

      return warehouses;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error("WarehouseRepositoryService", `❌ Failed to fetch warehouses: ${message}`);
      throw error;
    }
  }
}