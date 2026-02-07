import { Repository } from "typeorm";
import { IPlantService } from "../Domain/services/IPlantService";
import { IAuditClient } from "../External/IAuditClient";
import { Plant } from "../Domain/models/Plant";
import { PlantStatus } from "../Domain/enums/PlantStatus";
import { CreatePlantDTO } from "../Domain/DTOs/CreatePlantDTO";
import { FilterPlantsDTO } from "../Domain/DTOs/FilterPlantsDTO";
import { HarvestPlantsDTO } from "../Domain/DTOs/HarvestPlantsDTO";
import { PlantBalanceDTO } from "../Domain/DTOs/PlantBalanceDTO";
import { Logger } from "../Infrastructure/Logger";
import { ResourceNotFoundException } from "../Domain/exceptions/ResourceNotFoundException";
import { BusinessRuleException } from "../Domain/exceptions/BusinessRuleException";
import { PlantBalance } from "../Domain/enums/PlantBalance";

/**
 * PlantService
 * 
 * Implementacija poslovne logike za rad sa biljkama
 */
export class PlantService implements IPlantService {
  private readonly logger: Logger;
  private readonly OIL_STRENGTH_MIN = 1.0;
  private readonly OIL_STRENGTH_MAX = 5.0;
  private readonly OIL_STRENGTH_THRESHOLD = 4.0;

  constructor(
    private readonly plantRepository: Repository<Plant>,
    private readonly auditClient: IAuditClient
  ) {
    this.logger = Logger.getInstance();
  }

  /**
   * Kreiraj novu biljku
   */
  async createPlant(dto: CreatePlantDTO): Promise<Plant> {
    try {
      this.logger.debug(
        "PlantService",
        `Creating plant: ${dto.commonName} from ${dto.originCountry}`
      );

      const aromaticOilStrength = dto.aromaticOilStrength ?? this.generateRandomOilStrength();

      const plant = this.plantRepository.create({
        commonName: dto.commonName,
        latinName: dto.latinName,
        originCountry: dto.originCountry,
        aromaticOilStrength,
        status: PlantStatus.PLANTED
      });

      const saved = await this.plantRepository.save(plant);

      await this.auditClient.logInfo(
        "PRODUCTION",
        `Plant created: ${saved.commonName} (${saved.latinName}) from ${saved.originCountry} with oil strength ${saved.aromaticOilStrength}`
      );

      this.logger.info(
        "PlantService",
        `✅ Plant created: ${saved.id}`
      );

      return saved;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error("PlantService", `❌ Failed to create plant: ${message}`);
      await this.auditClient.logError("PRODUCTION", `Failed to create plant: ${message}`);
      throw error;
    }
  }

  /**
   * Dohvati biljku po ID-u
   */
  async getPlantById(id: string): Promise<Plant> {
    try {
      this.logger.debug("PlantService", `Fetching plant: ${id}`);

      const plant = await this.plantRepository.findOne({ where: { id } });

      if (!plant) {
        throw new ResourceNotFoundException(`Plant with ID ${id} not found`);
      }

      await this.auditClient.logInfo("PRODUCTION", `Fetched plant: ${plant.commonName}`);
      return plant;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error("PlantService", `❌ Failed to fetch plant: ${message}`);
      throw error;
    }
  }

  /**
   * Dohvati sve biljke sa filterima
   */
  async getAllPlants(filters?: FilterPlantsDTO): Promise<Plant[]> {
    try {
      this.logger.debug(
        "PlantService",
        `Fetching all plants with filters: ${JSON.stringify(filters)}`
      );

      let query = this.plantRepository.createQueryBuilder("plant");

      if (filters?.status) {
        query = query.where("plant.status = :status", { status: filters.status });
      }

      if (filters?.commonName) {
        query = query.andWhere("plant.commonName LIKE :commonName", {
          commonName: `%${filters.commonName}%`
        });
      }

      query = query.orderBy("plant.createdAt", "DESC");

      const plants = await query.getMany();

      this.logger.info(
        "PlantService",
        `✅ Fetched ${plants.length} plants`
      );
      await this.auditClient.logInfo("PRODUCTION", `Fetched ${plants.length} plants`);

      return plants;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error("PlantService", `❌ Failed to fetch plants: ${message}`);
      throw error;
    }
  }

  /**
   * Ažuriraj biljku
   */
  async updatePlant(id: string, dto: CreatePlantDTO): Promise<Plant> {
    try {
      this.logger.debug("PlantService", `Updating plant: ${id}`);

      const plant = await this.getPlantById(id);

      plant.commonName = dto.commonName;
      plant.latinName = dto.latinName;
      plant.originCountry = dto.originCountry;

      if (dto.aromaticOilStrength !== undefined) {
        if (dto.aromaticOilStrength < this.OIL_STRENGTH_MIN || dto.aromaticOilStrength > this.OIL_STRENGTH_MAX) {
          throw new BusinessRuleException(
            `Aromatic oil strength must be between ${this.OIL_STRENGTH_MIN} and ${this.OIL_STRENGTH_MAX}`
          );
        }
        plant.aromaticOilStrength = dto.aromaticOilStrength;
      }

      const saved = await this.plantRepository.save(plant);

      await this.auditClient.logInfo("PRODUCTION", `Plant updated: ${saved.id}`);

      this.logger.info("PlantService", `✅ Plant updated: ${id}`);

      return saved;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error("PlantService", `❌ Failed to update plant: ${message}`);
      await this.auditClient.logError("PRODUCTION", `Failed to update plant: ${message}`);
      throw error;
    }
  }

  /**
   * Obriši biljku
   */
  async deletePlant(id: string): Promise<void> {
    try {
      this.logger.debug("PlantService", `Deleting plant: ${id}`);

      const plant = await this.getPlantById(id);

      if (plant.status !== PlantStatus.PLANTED) {
        throw new BusinessRuleException(
          `Only plants with status PLANTED can be deleted. Current status: ${plant.status}`
        );
      }

      await this.plantRepository.remove(plant);

      await this.auditClient.logInfo("PRODUCTION", `Plant deleted: ${id}`);

      this.logger.info("PlantService", `✅ Plant deleted: ${id}`);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error("PlantService", `❌ Failed to delete plant: ${message}`);
      await this.auditClient.logError("PRODUCTION", `Failed to delete plant: ${message}`);
      throw error;
    }
  }

  /**
   * Uberi biljke
   * 
   * Vraća dostupne biljke (čak i ako je broj manji od traženog ili 0).
   * Processing service je odgovoran za kreiranje novih biljaka ako nema dovoljno.
   */
  async harvestPlants(dto: HarvestPlantsDTO): Promise<Plant[]> {
    try {
      this.logger.debug(
        "PlantService",
        `Harvesting ${dto.count} plants of type ${dto.commonName}`
      );

      const plants = await this.plantRepository.find({
        where: {
          commonName: dto.commonName,
          status: PlantStatus.PLANTED
        },
        take: dto.count
      });

      if (plants.length < dto.count) {
        this.logger.warn(
          "PlantService",
          `⚠️ Only ${plants.length} plants available, requested ${dto.count}`
        );

        await this.auditClient.logWarning(
          "PRODUCTION",
          `Requested ${dto.count} plants of ${dto.commonName}, but only ${plants.length} available`
        );
      }

      // Ako nema biljaka, samo vrati praznu listu - Processing service će zasaditi nove
      if (plants.length === 0) {
        this.logger.info(
          "PlantService",
          `ℹ️ No plants available for harvesting: ${dto.commonName}. Processing service will create new plants.`
        );

        await this.auditClient.logInfo(
          "PRODUCTION",
          `No plants available for harvesting: ${dto.commonName}. Processing service will handle plant creation.`
        );

        return [];
      }

      for (const plant of plants) {
        plant.status = PlantStatus.HARVESTED;
      }

      const saved = await this.plantRepository.save(plants);

      await this.auditClient.logInfo(
        "PRODUCTION",
        `Harvested ${saved.length} plants of type ${dto.commonName}`
      );

      this.logger.info(
        "PlantService",
        `✅ Harvested ${saved.length} plants`
      );

      return saved;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error("PlantService", `❌ Failed to harvest plants: ${message}`);
      await this.auditClient.logError("PRODUCTION", `Failed to harvest plants: ${message}`);
      throw error;
    }
  }

  /**
   * Promeni jačinu aromatinog ulja
   * 
   * Nova vrednost = trenutna * (1 + procenat/100)
   * Granice: minimum 1.0, maksimum 5.0
   * Dozvoljeni raspon: -100% do +100%
   */
  async adjustOilStrength(id: string, percentage: number): Promise<Plant> {
    try {
      this.logger.debug(
        "PlantService",
        `Adjusting oil strength for plant ${id} by ${percentage}%`
      );

      const plant = await this.getPlantById(id);
      const originalStrength = parseFloat(String(plant.aromaticOilStrength));

      // Nova vrednost = originalStrength * (1 + percentage/100)
      // Npr: 4 * (1 + 0.5) = 4 * 1.5 = 6 (ograniči na 5)
      // Npr: 2 * (1 - 0.5) = 2 * 0.5 = 1
      let newStrength = originalStrength * (1 + percentage / 100);

      // Primeni granice: minimalno 1.0, maksimalno 5.0
      if (newStrength < this.OIL_STRENGTH_MIN) {
        this.logger.warn(
          "PlantService",
          `⚠️ Adjustment ${percentage}% would result in ${newStrength.toFixed(2)}, ` +
          `which is below minimum ${this.OIL_STRENGTH_MIN}. Setting to minimum.`
        );
        newStrength = this.OIL_STRENGTH_MIN;
      }

      if (newStrength > this.OIL_STRENGTH_MAX) {
        this.logger.warn(
          "PlantService",
          `⚠️ Adjustment ${percentage}% would result in ${newStrength.toFixed(2)}, ` +
          `which exceeds maximum ${this.OIL_STRENGTH_MAX}. Setting to maximum.`
        );
        newStrength = this.OIL_STRENGTH_MAX;
      }

      plant.aromaticOilStrength = parseFloat(newStrength.toFixed(2));

      const saved = await this.plantRepository.save(plant);
      const savedStrength = parseFloat(String(saved.aromaticOilStrength));

      await this.auditClient.logInfo(
        "PRODUCTION",
        `Plant ${id} oil strength adjusted from ${originalStrength.toFixed(2)} to ${savedStrength.toFixed(2)} (${percentage > 0 ? '+' : ''}${percentage}%)`
      );

      this.logger.info(
        "PlantService",
        `✅ Plant oil strength adjusted: ${id} (${originalStrength.toFixed(2)} -> ${savedStrength.toFixed(2)})`
      );

      return saved;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error("PlantService", `❌ Failed to adjust oil strength: ${message}`);
      await this.auditClient.logError("PRODUCTION", `Failed to adjust oil strength: ${message}`);
      throw error;
    }
  }

  /**
   * Dohvati dostupne biljke
   */
  async getAvailablePlants(commonName: string): Promise<Plant[]> {
    try {
      this.logger.debug(
        "PlantService",
        `Fetching available plants: ${commonName}`
      );

      const plants = await this.plantRepository.find({
        where: {
          commonName,
          status: PlantStatus.PLANTED
        }
      });

      await this.auditClient.logInfo("PRODUCTION", `Fetched ${plants.length} available plants: ${commonName}`);
      return plants;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error("PlantService", `❌ Failed to fetch available plants: ${message}`);
      throw error;
    }
  }

  /**
   * Označi biljke kao obrađene
   */
  async markAsProcessed(plantIds: string[]): Promise<void> {
    try {
      this.logger.debug(
        "PlantService",
        `Marking ${plantIds.length} plants as processed`
      );

      const plants = await this.plantRepository.findByIds(plantIds);

      for (const plant of plants) {
        plant.status = PlantStatus.PROCESSED;
      }

      await this.plantRepository.save(plants);

      await this.auditClient.logInfo(
        "PRODUCTION",
        `${plants.length} plants marked as processed`
      );

      this.logger.info(
        "PlantService",
        `✅ Marked ${plants.length} plants as processed`
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error("PlantService", `❌ Failed to mark plants as processed: ${message}`);
      await this.auditClient.logError("PRODUCTION", `Failed to mark plants as processed: ${message}`);
      throw error;
    }
  }

  /**
   * Proveri balans jačine ulja
   */
  async checkOilStrengthBalance(plant: Plant): Promise<PlantBalanceDTO> {
    try {
      const deviation = plant.aromaticOilStrength - this.OIL_STRENGTH_THRESHOLD;
      const isUnbalanced = plant.aromaticOilStrength > this.OIL_STRENGTH_THRESHOLD;

      let balanceStatus = PlantBalance.BALANCED;
      if (isUnbalanced && deviation <= 0.5) {
        balanceStatus = PlantBalance.UNBALANCED;
      } else if (isUnbalanced && deviation > 0.5) {
        balanceStatus = PlantBalance.CRITICAL;
      }

      await this.auditClient.logInfo("PRODUCTION", `Oil strength balance checked for plant: ${plant.id} - Status: ${balanceStatus}`);

      return {
        plantId: plant.id,
        currentStrength: plant.aromaticOilStrength,
        targetStrength: this.OIL_STRENGTH_THRESHOLD,
        deviation,
        balanceStatus
      };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error("PlantService", `❌ Failed to check oil strength balance: ${message}`);
      throw error;
    }
  }

  /**
   * Privatne helper metode
   */

  /**
   * Generiši nasumičnu jačinu ulja
   */
  private generateRandomOilStrength(): number {
    const min = this.OIL_STRENGTH_MIN * 100;
    const max = this.OIL_STRENGTH_MAX * 100;
    const random = Math.floor(Math.random() * (max - min + 1) + min);
    return parseFloat((random / 100).toFixed(2));
  }
}