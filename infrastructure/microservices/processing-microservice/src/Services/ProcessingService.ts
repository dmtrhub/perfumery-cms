import { Repository, In } from "typeorm";
import { Perfume } from "../Domain/models/Perfume";
import { Packaging } from "../Domain/models/Packaging";
import { PerfumeStatus } from "../Domain/enums/PerfumeStatus";
import { PackagingStatus } from "../Domain/enums/PackagingStatus";
import { PlantDTO } from "../Domain/DTOs/PlantDTO";
import { StartProcessingDTO } from "../Domain/DTOs/StartProcessingDTO";
import { CreatePackagingDTO } from "../Domain/DTOs/CreatePackagingDTO";
import { FilterPerfumesDTO } from "../Domain/DTOs/FilterPerfumesDTO";
import { IAuditClient } from "../External/IAuditClient";
import { IProductionClient } from "../External/IProductionClient";
import { IStorageClient } from "../External/IStorageClient";
import { Logger } from "../Infrastructure/Logger";
import { ResourceNotFoundException } from "../Domain/exceptions/ResourceNotFoundException";
import { BusinessRuleException } from "../Domain/exceptions/BusinessRuleException";

/**
 * ProcessingService
 * Implementacija poslovne logike za preradu parfema
 */
export class ProcessingService {
  private readonly logger: Logger;
  private readonly OIL_STRENGTH_THRESHOLD = 4.0;
  private readonly ML_PER_PLANT = 50;

  constructor(
    private readonly perfumeRepository: Repository<Perfume>,
    private readonly packagingRepository: Repository<Packaging>,
    private readonly auditClient: IAuditClient,
    private readonly productionClient: IProductionClient,
    private readonly storageClient: IStorageClient
  ) {
    this.logger = Logger.getInstance();
  }

  // ==================== PERFUME METHODS ====================

  /**
   * Započni preradu - glavna metoda
   */
  async startProcessing(dto: StartProcessingDTO): Promise<Perfume[]> {
  try {
    this.logger.info(
      "ProcessingService",
      `🧪 Starting processing: ${dto.count} x ${dto.perfumeName} (${dto.bottleSize}ml)`
    );

    // 1. Izračunaj potreban broj biljaka
    const requiredPlants = Math.ceil((dto.count * dto.bottleSize) / this.ML_PER_PLANT);
    this.logger.debug("ProcessingService", `Required plants: ${requiredPlants}`);

    // 2. Uberi biljke iz Production servisa
    let plants = await this.productionClient.harvestPlants(dto.plantCommonName, requiredPlants);

    // 3. Ako nema dovoljno, zasadi nove i ponovo pokušaj
    if (plants.length < requiredPlants) {
      this.logger.warn(
        "ProcessingService",
        `⚠️ Not enough plants. Got ${plants.length}, need ${requiredPlants}. Planting more...`
      );

      const missing = requiredPlants - plants.length;
      const newPlantsToAdjust: {plant: PlantDTO, needsAdjustment: boolean, originalStrength?: number}[] = [];
      
      // Prvo kreiraj sve nove biljke i zapamti koje treba da se koriguju
      for (let i = 0; i < missing; i++) {
        const newPlant = await this.productionClient.createPlant(
          dto.plantCommonName,
          `${dto.plantCommonName} Latinum`,
          "Serbia"
        );
        
        // Proveri da li je nova biljka preko 4.0
        if (newPlant.aromaticOilStrength > this.OIL_STRENGTH_THRESHOLD) {
          newPlantsToAdjust.push({
            plant: newPlant,
            needsAdjustment: true,
            originalStrength: newPlant.aromaticOilStrength
          });
        } else {
          newPlantsToAdjust.push({
            plant: newPlant,
            needsAdjustment: false
          });
        }
        
        // Dodajemo malo kašnjenje između kreiranja biljaka
        if (i < missing - 1) {
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }

      // Sačekaj da se biljke potpuno kreiraju u bazi
      await new Promise(resolve => setTimeout(resolve, 200));

      // Prvo koriguj one nove biljke koje su preko 4.0
      for (const item of newPlantsToAdjust) {
        if (item.needsAdjustment && item.originalStrength) {
          // Izračunaj koliko je biljka iznad granice
          const excess = item.originalStrength - this.OIL_STRENGTH_THRESHOLD;
          
          // Koliko treba smanjiti (u procentima). Npr: 4.5 (excess 0.5) → reduce by 50%
          let reductionPercentage = excess * 100;
          
          // VAŽNO: Ograniči redukciju da biljka ne ide ispod minimuma (1.0)
          // Maksimalna moguća redukcija = (trenutna - minimum) / trenutna * 100
          const OIL_STRENGTH_MIN = 1.0;
          const maxPossibleReduction = ((item.originalStrength - OIL_STRENGTH_MIN) / item.originalStrength) * 100;
          
          if (reductionPercentage > maxPossibleReduction) {
            this.logger.warn(
              "ProcessingService",
              `⚠️ Reduction ${reductionPercentage.toFixed(2)}% would exceed minimum (1.0). ` +
              `Limiting to ${maxPossibleReduction.toFixed(2)}%`
            );
            reductionPercentage = maxPossibleReduction;
          }
          
          this.logger.debug(
            "ProcessingService",
            `Adjusting new plant ${item.plant.id}: excess ${excess.toFixed(2)}, ` +
            `reduction ${reductionPercentage.toFixed(2)}%, original ${item.originalStrength}`
          );

          // Koristi NEGATIVAN procenat za smanjenje
          await this.productionClient.adjustOilStrength(
            item.plant.id,
            -reductionPercentage
          );
        }
      }

      // Sada uberi sve biljke (i stare i nove)
      plants = await this.productionClient.harvestPlants(dto.plantCommonName, requiredPlants);

      await this.auditClient.logWarning(
        "PROCESSING",
        `Planted ${missing} new plants due to shortage`
      );
    }

    // 4. Proveri jačinu ulja za SVE biljke (i one koje su već bile i one nove)
    const processedPlants: PlantDTO[] = [];
    for (const plant of plants) {
      // Konvertuj aromaticOilStrength u broj ako je string
      const strengthValue = typeof plant.aromaticOilStrength === 'string' 
        ? parseFloat(plant.aromaticOilStrength)
        : plant.aromaticOilStrength;

      this.logger.debug(
        "ProcessingService",
        `Processing plant: ${plant.commonName}, strength: ${strengthValue}, type: ${typeof strengthValue}`
      );

      if (!strengthValue || typeof strengthValue !== 'number' || isNaN(strengthValue)) {
        this.logger.warn(
          "ProcessingService",
          `⚠️ Plant ${plant.id} has invalid aromaticOilStrength: ${plant.aromaticOilStrength}. Skipping adjustment.`
        );
        processedPlants.push(plant);
        continue;
      }

      if (strengthValue > this.OIL_STRENGTH_THRESHOLD) {
        // Izračunaj koliko je biljka prekoračila limit
        // Npr: 4.65 - 4.0 = 0.65 → 65% prekoračenja
        const excess = strengthValue - this.OIL_STRENGTH_THRESHOLD;
        const percentageToKeep = excess * 100; // Nova biljka se smanjuje NA ovaj procenat (65%)
        
        this.logger.info(
          "ProcessingService",
          `Plant exceeded threshold (${strengthValue.toFixed(2)}). ` +
          `Creating new plant and reducing to ${percentageToKeep.toFixed(2)}% of its strength`
        );

        // Zasadi novu biljku
        const newPlant = await this.productionClient.createPlant(
          plant.commonName,
          plant.latinName,
          plant.originCountry
        );

        // Sačekaj da se biljka kreira
        await new Promise(resolve => setTimeout(resolve, 100));

        // Konvertuj newPlant.aromaticOilStrength u broj ako je string
        const newPlantStrength = typeof newPlant.aromaticOilStrength === 'string'
          ? parseFloat(newPlant.aromaticOilStrength)
          : newPlant.aromaticOilStrength;

        // Izračunaj adjustment procenat: ako trebala biti NA 65%, to je smanjenje ZA 35%
        // percentageToKeep = 65 → adjustmentPercentage = 65 - 100 = -35
        let adjustmentPercentage = percentageToKeep - 100;
        
        // VAŽNO: Ako je prekoračenje >= 100% (biljka na maksimumu 5.0), nova ide na minimum
        const OIL_STRENGTH_MIN = 1.0;
        if (percentageToKeep >= 100) {
          // Ekstremno prekoračenje - postavi novu biljku na minimum
          adjustmentPercentage = ((OIL_STRENGTH_MIN / newPlantStrength) - 1) * 100;
          this.logger.warn(
            "ProcessingService",
            `⚠️ Extreme overflow (${strengthValue.toFixed(2)} > 5.0 capability). ` +
            `Setting new plant to minimum (1.0)`
          );
        } else {
          // Normalno prekoračenje - ograniči smanjenje da ne padne ispod minimuma
          const newStrengthAfterAdjustment = newPlantStrength * (1 + adjustmentPercentage / 100);
          
          if (newStrengthAfterAdjustment < OIL_STRENGTH_MIN) {
            // Ako bi adjustment bio prevelik, izračunaj maksimalno mogućan
            adjustmentPercentage = ((OIL_STRENGTH_MIN / newPlantStrength) - 1) * 100;
            
            this.logger.warn(
              "ProcessingService",
              `⚠️ Reduction would drop below minimum (1.0). ` +
              `Limiting reduction to ${Math.abs(adjustmentPercentage).toFixed(2)}%`
            );
          }
        }
        
        this.logger.debug(
          "ProcessingService",
          `Adjusting new plant: initial ${newPlantStrength.toFixed(2)}, ` +
          `adjustment ${adjustmentPercentage.toFixed(2)}% → target ${(newPlantStrength * (1 + adjustmentPercentage / 100)).toFixed(2)}`
        );
        
        const adjustedPlant = await this.productionClient.adjustOilStrength(
          newPlant.id,
          adjustmentPercentage
        );
        
        // Koristi direktno adjustovanu biljku (već ima pravilnu jačinu)
        // Ne harveštavaj ponovo da izbegneš da vratiš staru biljku
        processedPlants.push(adjustedPlant);
      } else {
        // Biljka je normalna (≤ 4.0), dodaj je u rezultate
        processedPlants.push(plant);
      }
    }

    // 5. Označi biljke kao obrađene
    const plantIds = processedPlants.map(p => p.id);
    await this.productionClient.markAsProcessed(plantIds);

    // 6. Kreiraj parfeme
    const perfumes: Perfume[] = [];
    const expirationDate = new Date();
    expirationDate.setFullYear(expirationDate.getFullYear() + 3);

    for (let i = 0; i < dto.count; i++) {
      const plantIndex = i % processedPlants.length;
      const plant = processedPlants[plantIndex];

      const perfume = this.perfumeRepository.create({
        name: dto.perfumeName,
        type: dto.type,
        netQuantityMl: dto.bottleSize,
        serialNumber: this.generateSerialNumber(),
        plantId: plant.id,
        expirationDate,
        status: PerfumeStatus.CREATED
      });

      perfumes.push(perfume);
    }

    const savedPerfumes = await this.perfumeRepository.save(perfumes);

    await this.auditClient.logInfo(
      "PROCESSING",
      `Created ${savedPerfumes.length} perfumes: ${dto.perfumeName}`
    );

    this.logger.info(
      "ProcessingService",
      `✅ Created ${savedPerfumes.length} perfumes`
    );

    return savedPerfumes;
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    this.logger.error("ProcessingService", `❌ Failed to start processing: ${message}`);
    await this.auditClient.logError("PROCESSING", `Failed to start processing: ${message}`);
    throw error;
  }
}

  /**
   * Dohvati parfem po ID-u
   */
  async getPerfumeById(id: string): Promise<Perfume> {
    try {
      this.logger.debug("ProcessingService", `Fetching perfume: ${id}`);
      const perfume = await this.perfumeRepository.findOne({ where: { id } });

      if (!perfume) {
        throw new ResourceNotFoundException(`Perfume with ID ${id} not found`);
      }

      await this.auditClient.logInfo("PROCESSING", `Fetched perfume: ${perfume.name}`);
      return perfume;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error("ProcessingService", `Failed to fetch perfume: ${message}`);
      await this.auditClient.logError("PROCESSING", `Failed to fetch perfume ${id}: ${message}`);
      throw error;
    }
  }

  /**
   * Dohvati sve parfeme
   */
  async getAllPerfumes(filters?: FilterPerfumesDTO): Promise<Perfume[]> {
    try {
      this.logger.debug("ProcessingService", `Fetching all perfumes with filters: ${JSON.stringify(filters)}`);
      let query = this.perfumeRepository.createQueryBuilder("perfume");

      if (filters?.type) {
        query = query.where("perfume.type = :type", { type: filters.type });
      }

      if (filters?.status) {
        query = query.andWhere("perfume.status = :status", { status: filters.status });
      }

      query = query.orderBy("perfume.createdAt", "DESC");

      const perfumes = await query.getMany();
      await this.auditClient.logInfo("PROCESSING", `Fetched ${perfumes.length} perfumes`);
      return perfumes;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error("ProcessingService", `Failed to fetch perfumes: ${message}`);
      await this.auditClient.logError("PROCESSING", `Failed to fetch perfumes: ${message}`);
      throw error;
    }
  }

  // ==================== PACKAGING METHODS ====================

  /**
   * Pakuj parfeme
   * 
   * Ako su neki parfumi već pakovani, preskače ih i nastavlja sa ostalima.
   * Vraća packaging samo sa novim (nepakovanimм) parfumima.
   */
  async createPackaging(dto: CreatePackagingDTO): Promise<Packaging> {
    try {
      this.logger.info("ProcessingService", `📦 Creating packaging: ${dto.name}`);

      // 1. Pronađi parfeme
      const perfumes = await this.perfumeRepository.find({
        where: { id: In(dto.perfumeIds) }
      });

      if (perfumes.length !== dto.perfumeIds.length) {
        throw new ResourceNotFoundException(
          `Some perfumes not found. Found ${perfumes.length} of ${dto.perfumeIds.length}`
        );
      }

      // 2. Filtrira parfume - prikuplja već pakovane i one sa lošim statusom
      const alreadyPacked: string[] = [];
      const invalidStatus: { id: string; status: string }[] = [];
      const validPerfumes = perfumes.filter(perfume => {
        if (perfume.packagingId) {
          alreadyPacked.push(perfume.id);
          return false;
        }
        if (perfume.status !== PerfumeStatus.CREATED) {
          invalidStatus.push({ id: perfume.id, status: perfume.status });
          return false;
        }
        return true;
      });

      // 3. Loguj probleme
      if (alreadyPacked.length > 0) {
        this.logger.warn(
          "ProcessingService",
          `⚠️ ${alreadyPacked.length} perfume(s) already packed: ${alreadyPacked.join(", ")}`
        );
        await this.auditClient.logWarning(
          "PROCESSING",
          `${alreadyPacked.length} perfume(s) already packed, skipping them`
        );
      }

      if (invalidStatus.length > 0) {
        this.logger.warn(
          "ProcessingService",
          `⚠️ ${invalidStatus.length} perfume(s) with invalid status: ${invalidStatus.map(p => `${p.id}(${p.status})`).join(", ")}`
        );
        await this.auditClient.logWarning(
          "PROCESSING",
          `${invalidStatus.length} perfume(s) with invalid status, skipping them`
        );
      }

      // 4. Ako nema validnih parfuma, baci grešku
      if (validPerfumes.length === 0) {
        throw new BusinessRuleException(
          `No valid perfumes available for packaging. Already packed: ${alreadyPacked.length}, Invalid status: ${invalidStatus.length}`
        );
      }

      // 5. Kreiraj ambalažu
      const packaging = this.packagingRepository.create({
        name: dto.name,
        senderAddress: dto.senderAddress,
        warehouseId: dto.warehouseId,
        status: PackagingStatus.PACKED
      });

      const savedPackaging = await this.packagingRepository.save(packaging);

      // 6. Poveži SAMO VALIDNE parfume sa ambalažom
      for (const perfume of validPerfumes) {
        perfume.packagingId = savedPackaging.id;
        perfume.status = PerfumeStatus.PACKED;
      }

      await this.perfumeRepository.save(validPerfumes);

      // 7. Učitaj ambalažu sa parfemima
      const result = await this.packagingRepository.findOne({
        where: { id: savedPackaging.id },
        relations: ["perfumes"]
      });

      await this.auditClient.logInfo(
        "PROCESSING",
        `Packaging created: ${savedPackaging.id} with ${validPerfumes.length} perfumes` +
        (alreadyPacked.length > 0 ? ` (${alreadyPacked.length} already packed, skipped)` : "") +
        (invalidStatus.length > 0 ? ` (${invalidStatus.length} invalid status, skipped)` : "")
      );

      this.logger.info(
        "ProcessingService",
        `✅ Packaging created: ${savedPackaging.id} with ${validPerfumes.length}/${dto.perfumeIds.length} perfumes`
      );

      return result!;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error("ProcessingService", `❌ Failed to create packaging: ${message}`);
      await this.auditClient.logError("PROCESSING", `Failed to create packaging: ${message}`);
      throw error;
    }
  }

  /**
   * Pošalji ambalažu u Storage
   */
  async sendPackaging(packagingId: string): Promise<Packaging> {
    try {
      this.logger.info("ProcessingService", `📤 Sending packaging: ${packagingId}`);

      // 1. Pronađi ambalažu
      const packaging = await this.packagingRepository.findOne({
        where: { id: packagingId },
        relations: ["perfumes"]
      });

      if (!packaging) {
        throw new ResourceNotFoundException(`Packaging with ID ${packagingId} not found`);
      }

      // 2. Proveri status
      if (packaging.status !== PackagingStatus.PACKED) {
        throw new BusinessRuleException(
          `Packaging ${packagingId} has invalid status: ${packaging.status}. Expected: PACKED`
        );
      }

      // 3. Pozovi Storage servis
      await this.storageClient.receivePackaging(packagingId);

      // 4. Ažuriraj status
      packaging.status = PackagingStatus.SENT;
      packaging.sentAt = new Date();

      const saved = await this.packagingRepository.save(packaging);

      await this.auditClient.logInfo(
        "PROCESSING",
        `Packaging ${packagingId} sent to storage`
      );

      this.logger.info("ProcessingService", `✅ Packaging sent: ${packagingId}`);

      return saved;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error("ProcessingService", `❌ Failed to send packaging: ${message}`);
      await this.auditClient.logError("PROCESSING", `Failed to send packaging: ${message}`);
      throw error;
    }
  }

  /**
   * Dohvati sve ambalaze
   */
  async getAllPackagings(): Promise<Packaging[]> {
    try {
      this.logger.debug("ProcessingService", `Fetching all packagings`);
      const packagings = await this.packagingRepository.find({
        relations: ["perfumes"],
        order: { createdAt: "DESC" }
      });

      await this.auditClient.logInfo("PROCESSING", `Fetched ${packagings.length} packagings`);
      return packagings;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error("ProcessingService", `Failed to fetch packagings: ${message}`);
      await this.auditClient.logError("PROCESSING", `Failed to fetch packagings: ${message}`);
      throw error;
    }
  }

  /**
   * Dohvati ambalažu po ID-u
   */
  async getPackagingById(id: string): Promise<Packaging> {
    try {
      this.logger.debug("ProcessingService", `Fetching packaging: ${id}`);
      const packaging = await this.packagingRepository.findOne({
        where: { id },
        relations: ["perfumes"]
      });

      if (!packaging) {
        throw new ResourceNotFoundException(`Packaging with ID ${id} not found`);
      }

      await this.auditClient.logInfo("PROCESSING", `Fetched packaging: ${packaging.id}`);
      return packaging;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error("ProcessingService", `Failed to fetch packaging: ${message}`);
      await this.auditClient.logError("PROCESSING", `Failed to fetch packaging ${id}: ${message}`);
      throw error;
    }
  }

  // ==================== HELPER METHODS ====================

  /**
   * Generiši jedinstveni serijski broj
   * Format: PP-YYYY-TIMESTAMP-RANDOM
   * Npr: PP-2026-1707326769123-AB42
   */
  private generateSerialNumber(): string {
    const year = new Date().getFullYear();
    const timestamp = Date.now();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `PP-${year}-${timestamp}-${random}`;
  }
}