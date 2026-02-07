import { Repository } from "typeorm";
import { StoragePackaging } from "../Domain/models/StoragePackaging";
import { Warehouse } from "../Domain/models/Warehouse";
import { PackagingStatus } from "../Domain/enums/PackagingStatus";
import { Logger } from "../Infrastructure/Logger";
import { ResourceNotFoundException } from "../Domain/exceptions/ResourceNotFoundException";
import { BusinessRuleException } from "../Domain/exceptions/BusinessRuleException";
import { IAuditClient } from "../External/IAuditClient";
import { IProcessingClient } from "../External/IProcessingClient";
import { StorageCoordinator } from "./StorageCoordinator";

/**
 * PackagingRepositoryService
 * Servis za rad sa ambalaž ama
 */
export class PackagingRepositoryService {
  private readonly logger: Logger;
  private readonly storageCoordinator: StorageCoordinator;

  constructor(
    private readonly packagingRepository: Repository<StoragePackaging>,
    private readonly warehouseRepository: Repository<Warehouse>,
    private readonly auditClient: IAuditClient,
    private readonly processingClient: IProcessingClient
  ) {
    this.logger = Logger.getInstance();
    this.storageCoordinator = new StorageCoordinator();
  }

  /**
   * Primi ambalažu iz Processing servisa
   */
  async receivePackaging(packagingId: string): Promise<StoragePackaging> {
    try {
      this.logger.debug("PackagingRepositoryService", `Receiving packaging: ${packagingId}`);

      // 1. Dohvati detalje ambalaže iz Processing servisa
      const processingPackaging = await this.processingClient.getPackagingById(packagingId);

      // Ekstraktuj perfumeIds - prioritizuj direktno perfumeIds, pa zatim iz perfumes niza
      let perfumeIds: string[] = [];
      if (Array.isArray(processingPackaging.perfumeIds) && processingPackaging.perfumeIds.length > 0) {
        perfumeIds = processingPackaging.perfumeIds;
      } else if (Array.isArray(processingPackaging.perfumes) && processingPackaging.perfumes.length > 0) {
        perfumeIds = processingPackaging.perfumes.map(p => p.id);
      }

      // 2. Pronađi skladište
      const warehouse = await this.warehouseRepository.findOne({
        where: { id: processingPackaging.warehouseId },
        relations: ["packagings"]
      });

      if (!warehouse) {
        throw new ResourceNotFoundException(
          `Warehouse with ID ${processingPackaging.warehouseId} not found`
        );
      }

      // 3. Proveri kapacitet (samo STORED pakovanja se broje)
      const storedCount = warehouse.packagings?.filter(p => p.status === "STORED").length || 0;
      if (storedCount >= warehouse.maxCapacity) {
        throw new BusinessRuleException(
          `Warehouse ${warehouse.name} is at full capacity (${warehouse.maxCapacity})`
        );
      }

      // 4. Kreiraj StoragePackaging sa perfume detaljima
      const storagePackaging = this.packagingRepository.create({
        originalPackagingId: packagingId,
        warehouseId: warehouse.id,
        perfumeIds: perfumeIds,
        perfumes: processingPackaging.perfumes || [], // Čuva i sve perfume detalje
        status: PackagingStatus.STORED
      });

      const saved = await this.packagingRepository.save(storagePackaging);

      // 5. Povećaj broj ambalaža u warehouse-u (STORED pakovanja)
      const newStoredCount = warehouse.packagings.length + 1; // Sada je saved uključena
      this.logger.info(
        "PackagingRepositoryService",
        `Increased warehouse ${warehouse.name} STORED packagings count to ${newStoredCount} / ${warehouse.maxCapacity}`
      );

      await this.auditClient.logInfo(
        "STORAGE",
        `Packaging ${packagingId} received at warehouse ${warehouse.name} with ${perfumeIds.length} perfumes`
      );

      return saved;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error("PackagingRepositoryService", `Failed to receive packaging: ${message}`);
      await this.auditClient.logError("STORAGE", `Failed to receive packaging: ${message}`);
      throw error;
    }
  }

  /**
   * Pošalji ambalaže Sales-u
   */
  async sendToSales(count: number, userRole: string): Promise<StoragePackaging[]> {
    try {
      this.logger.info(
        "PackagingRepositoryService",
        `Sending ${count} packagings to sales (role: ${userRole})`
      );

      // 1. Pronađi ambalaže sa statusom STORED
      const packagings = await this.packagingRepository.find({
        where: { status: PackagingStatus.STORED },
        take: count,
        relations: ["warehouse"]
      });

      if (packagings.length === 0) {
        throw new BusinessRuleException("No packagings available to send");
      }

      // 2. Dohvati strategiju
      const strategy = this.storageCoordinator.getStrategy(userRole);

      // 3. Primeni strategiju
      const toSend = await strategy.sendPackagings(packagings.slice(0, strategy.getMaxPerSend()));

      // 4. Sačuvaj ažurirane ambalaže
      const saved = await this.packagingRepository.save(toSend);

      // 5. Smanjи broj STORED ambalaža u warehouse-u
      for (const packaging of saved) {
        if (packaging.warehouse) {
          // Broji samo STORED pakovanja (sada su neka promenjena na SENT_TO_SALES)
          const storedNow = packaging.warehouse.packagings?.filter(p => p.status === "STORED").length || 0;
          this.logger.info(
            "PackagingRepositoryService",
            `Warehouse ${packaging.warehouse.name} now has ${storedNow} STORED packagings (max: ${packaging.warehouse.maxCapacity})`
          );
        }
      }

      await this.auditClient.logInfo(
        "STORAGE",
        `Sent ${saved.length} packagings to sales using ${userRole === "SALES_MANAGER" ? "DistributionCenterStrategy" : "WarehouseCenterStrategy"}`
      );

      return saved;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error("PackagingRepositoryService", `Failed to send packagings: ${message}`);
      await this.auditClient.logError("STORAGE", `Failed to send packagings: ${message}`);
      throw error;
    }
  }

  /**
   * Dohvati ambalažu po ID-u
   */
  async getPackagingById(id: string): Promise<StoragePackaging> {
    try {
      const packaging = await this.packagingRepository.findOne({
        where: { id },
        relations: ["warehouse"]
      });

      if (!packaging) {
        throw new ResourceNotFoundException(`Packaging with ID ${id} not found`);
      }

      await this.auditClient.logInfo("STORAGE", `Fetched packaging: ${packaging.id}`);
      return packaging;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error("PackagingRepositoryService", `Failed to fetch packaging: ${message}`);
      throw error;
    }
  }

  /**
   * Dohvati sve ambalaže
   */
  async getAllPackagings(): Promise<StoragePackaging[]> {
    try {
      const packagings = await this.packagingRepository.find({
        relations: ["warehouse"],
        order: { createdAt: "DESC" }
      });

      await this.auditClient.logInfo("STORAGE", `Fetched ${packagings.length} packagings`);
      return packagings;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error("PackagingRepositoryService", `Failed to fetch packagings: ${message}`);
      throw error;
    }
  }
}