import { Repository, MoreThan, LessThanOrEqual } from "typeorm";
import { Plant } from "../Domain/models/Plant";
import { PlantState } from "../Domain/enums/PlantState";
import { ProductionLog } from "../Domain/models/ProductionLog";
import { ProductionEventType } from "../Domain/enums/ProductionEventType";
import { IProductionService } from "../Domain/services/IProductionService";
import { PlantDTO } from "../Domain/DTOs/PlantDTO";
import { CreatePlantDTO } from "../Domain/DTOs/CreatePlantDTO";
import { UpdatePlantOilIntensityDTO } from "../Domain/DTOs/UpdatePlantOilIntensityDTO";
import { HarvestPlantsDTO } from "../Domain/DTOs/HarvestPlantsDTO";
import { AuditClient } from "../External/AuditClient";

export class ProductionService implements IProductionService {
  private auditClient: AuditClient;

  constructor(
    private plantRepository: Repository<Plant>,
    private productionLogRepository: Repository<ProductionLog>
  ) {
    this.auditClient = new AuditClient();
    console.log("\x1b[35m[ProductionService@1.0.0]\x1b[0m Service started");

    // Start periodic harvest availability check
    this.startHarvestAvailabilityCheck();
  }

  // Starts periodic check for harvest availability
  private startHarvestAvailabilityCheck(): void {
    setInterval(async () => {
      try {
        await this.checkAndUpdateHarvestAvailability();
      } catch (error) {
        console.error("Error in harvest availability check:", error);
      }
    }, 60 * 60 * 1000); // Check every hour
  }

  // Checks and updates harvest availability for plants
  private async checkAndUpdateHarvestAvailability(): Promise<void> {
    const plants = await this.plantRepository.find({
      where: { 
        availableForHarvest: false,
        state: PlantState.PLANTED
      }
    });

    let updatedCount = 0;
    for (const plant of plants) {
      plant.updateHarvestAvailability();
      if (plant.availableForHarvest) {
        updatedCount++;
        
        // Log the change
        await this.productionLogRepository.save({
          eventType: ProductionEventType.INFO,
          description: `Plant ${plant.name} is now available for harvest`,
          plant,
          successful: true
        });
      }
    }

    if (updatedCount > 0) {
      await this.plantRepository.save(plants);
      console.log(`\x1b[32m[ProductionService]\x1b[0m Updated ${updatedCount} plants to available for harvest`);
    }
  }

  async createPlant(data: CreatePlantDTO): Promise<PlantDTO> {
    try {
      console.log(`\x1b[35m[ProductionService]\x1b[0m Creating plant: ${data.name}`);

      await this.auditClient.logInfo(
        "PRODUCTION",
        "CREATE_PLANT_STARTED",
        `Starting to create plant: ${data.name}`,
        { ...data, timestamp: new Date().toISOString() }
      );

      const oilIntensity = data.oilIntensity || this.generateRandomOilIntensity();

      const newPlant = new Plant();
      newPlant.name = data.name;
      newPlant.latinName = data.latinName;
      newPlant.countryOfOrigin = data.countryOfOrigin;
      newPlant.oilIntensity = oilIntensity;
      newPlant.state = PlantState.PLANTED;
      newPlant.quantity = data.quantity;
      newPlant.availableForHarvest = false;
      
      // If for processing, set remainingForProcessing
      if (data.forProcessing) {
        newPlant.remainingForProcessing = data.quantity;
      }

      const savedPlant = await this.plantRepository.save(newPlant);

      // Production log
      await this.productionLogRepository.save({
        eventType: ProductionEventType.PLANTING,
        description: `Planted new plant: ${data.name} (${data.quantity} pieces)`,
        details: {
          plantId: savedPlant.id,
          oilIntensity,
          quantity: data.quantity,
          forProcessing: data.forProcessing || false
        },
        plant: savedPlant,
        quantity: data.quantity,
        oilIntensity: oilIntensity,
        userId: data.userId,
        successful: true,
        source: data.userId ? "CLIENT" : "PROCESSING_SERVICE",
      });

      await this.auditClient.logInfo(
        "PRODUCTION",
        "CREATE_PLANT_SUCCESS",
        `Plant created successfully: ${data.name} (ID: ${savedPlant.id})`,
        {
          plantId: savedPlant.id,
          name: data.name,
          oilIntensity,
          quantity: data.quantity,
          userId: data.userId,
          timestamp: new Date().toISOString(),
        }
      );

      console.log(`\x1b[32m[ProductionService]\x1b[0m Plant created: ${data.name} (ID: ${savedPlant.id})`);
      return this.toPlantDTO(savedPlant);
    } catch (error: any) {
      console.error(`\x1b[31m[ProductionService]\x1b[0m Failed to plant ${data.name}:`, error);

      await this.auditClient.logError(
        "PRODUCTION",
        "CREATE_PLANT_FAILED",
        error,
        {
          plantName: data.name,
          ...data,
          timestamp: new Date().toISOString(),
        }
      );

      throw new Error(`Failed to create plant: ${error.message}`);
    }
  }

  async getAllPlants(): Promise<PlantDTO[]> {
    try {
      console.log("\x1b[35m[ProductionService]\x1b[0m Getting all plants");

      // Audit: Operation start
      await this.auditClient.logInfo(
        "PRODUCTION",
        "GET_ALL_PLANTS",
        "Retrieving all plants from database",
        { timestamp: new Date().toISOString() }
      );

      const plants = await this.plantRepository.find();
      const count = plants.length;

      // Audit: Operation success with count
      await this.auditClient.logInfo(
        "PRODUCTION",
        "GET_ALL_PLANTS_SUCCESS",
        `Retrieved ${count} plants from database`,
        { count, timestamp: new Date().toISOString() }
      );

      return plants.map((plant) => this.toPlantDTO(plant));
    } catch (error: any) {
      console.error(
        `\x1b[31m[ProductionService]\x1b[0m Failed to get all plants:`,
        error
      );

      // Audit: Error
      await this.auditClient.logError(
        "PRODUCTION",
        "GET_ALL_PLANTS_FAILED",
        error,
        { timestamp: new Date().toISOString() }
      );

      throw new Error(`Failed to get all plants: ${error.message}`);
    }
  }

  async getPlantById(id: number): Promise<PlantDTO | null> {
    try {
      console.log(
        `\x1b[35m[ProductionService]\x1b[0m Getting plant by ID: ${id}`
      );

      // Audit: Operation start
      await this.auditClient.logInfo(
        "PRODUCTION",
        "GET_PLANT_BY_ID",
        `Retrieving plant with ID: ${id}`,
        { plantId: id, timestamp: new Date().toISOString() }
      );

      const plant = await this.plantRepository.findOne({ where: { id } });

      if (plant) {
        // Audit: Found
        await this.auditClient.logInfo(
          "PRODUCTION",
          "GET_PLANT_BY_ID_SUCCESS",
          `Found plant: ${plant.name} (ID: ${plant.id})`,
          {
            plantId: id,
            plantName: plant.name,
            timestamp: new Date().toISOString(),
          }
        );
        return this.toPlantDTO(plant);
      } else {
        // Audit: Not found
        await this.auditClient.logWarning(
          "PRODUCTION",
          "GET_PLANT_BY_ID_NOT_FOUND",
          `Plant not found with ID: ${id}`,
          { plantId: id, timestamp: new Date().toISOString() }
        );
        return null;
      }
    } catch (error: any) {
      console.error(
        `\x1b[31m[ProductionService]\x1b[0m Failed to get plant by ID ${id}:`,
        error
      );

      // Audit: Error
      await this.auditClient.logError(
        "PRODUCTION",
        "GET_PLANT_BY_ID_FAILED",
        error,
        { plantId: id, timestamp: new Date().toISOString() }
      );

      throw new Error(`Failed to get plant by ID: ${error.message}`);
    }
  }

  async getAvailablePlants(): Promise<PlantDTO[]> {
    try {
      console.log("\x1b[35m[ProductionService]\x1b[0m Getting available plants");

      // Audit: Operation
      await this.auditClient.logInfo(
        "PRODUCTION",
        "GET_AVAILABLE_PLANTS",
        "Retrieving plants available for harvest",
        { timestamp: new Date().toISOString() }
      );

      const plants = await this.plantRepository.find({
        where: { 
          state: PlantState.PLANTED,
          quantity: MoreThan(0)
        }
      });

      // Filter based on harvest readiness
      const availablePlants = plants.filter(plant => plant.isReadyForHarvest());

      // Audit: Success with count
      await this.auditClient.logInfo(
        "PRODUCTION",
        "GET_AVAILABLE_PLANTS_SUCCESS",
        `Found ${availablePlants.length} plants available for harvest`,
        { count: availablePlants.length, timestamp: new Date().toISOString() }
      );

      return availablePlants.map((plant) => this.toPlantDTO(plant));
    } catch (error: any) {
      console.error(
        `\x1b[31m[ProductionService]\x1b[0m Failed to get available plants:`,
        error
      );

      // Audit: Error
      await this.auditClient.logError(
        "PRODUCTION",
        "GET_AVAILABLE_PLANTS_FAILED",
        error,
        { timestamp: new Date().toISOString() }
      );

      throw new Error(`Failed to get available plants: ${error.message}`);
    }
  }

  async getPlantsForProcessing(): Promise<PlantDTO[]> {
    try {
      console.log(
        "\x1b[35m[ProductionService]\x1b[0m Getting plants for processing"
      );

      // Audit: Operation
      await this.auditClient.logInfo(
        "PRODUCTION",
        "GET_PLANTS_FOR_PROCESSING",
        "Retrieving plants available for processing",
        { timestamp: new Date().toISOString() }
      );

      const plants = await this.plantRepository.find({
        where: { 
          state: PlantState.PLANTED,
          remainingForProcessing: MoreThan(0),
          quantity: MoreThan(0)
        }
      });

      // Audit: Success with count
      await this.auditClient.logInfo(
        "PRODUCTION",
        "GET_PLANTS_FOR_PROCESSING_SUCCESS",
        `Found ${plants.length} plants available for processing`,
        { count: plants.length, timestamp: new Date().toISOString() }
      );

      return plants.map((plant) => this.toPlantDTO(plant));
    } catch (error: any) {
      console.error(
        `\x1b[31m[ProductionService]\x1b[0m Failed to get plants for processing:`,
        error
      );

      // Audit: Error
      await this.auditClient.logError(
        "PRODUCTION",
        "GET_PLANTS_FOR_PROCESSING_FAILED",
        error,
        { timestamp: new Date().toISOString() }
      );

      throw new Error(`Failed to get plants for processing: ${error.message}`);
    }
  }

  async getPlantsExceedingThreshold(): Promise<PlantDTO[]> {
    try {
      console.log("\x1b[35m[ProductionService]\x1b[0m Getting plants exceeding 4.00 threshold");

      await this.auditClient.logInfo(
        "PRODUCTION",
        "GET_PLANTS_EXCEEDING_THRESHOLD",
        "Retrieving plants exceeding 4.00 oil intensity threshold",
        { timestamp: new Date().toISOString() }
      );

      const plants = await this.plantRepository.find({
        where: { oilIntensity: MoreThan(4.0) }
      });

      await this.auditClient.logInfo(
        "PRODUCTION",
        "GET_PLANTS_EXCEEDING_THRESHOLD_SUCCESS",
        `Found ${plants.length} plants exceeding 4.00 threshold`,
        { count: plants.length, timestamp: new Date().toISOString() }
      );

      return plants.map(plant => this.toPlantDTO(plant));
    } catch (error: any) {
      console.error(`\x1b[31m[ProductionService]\x1b[0m Failed to get plants exceeding threshold:`, error);
      
      await this.auditClient.logError(
        "PRODUCTION",
        "GET_PLANTS_EXCEEDING_THRESHOLD_FAILED",
        error,
        { timestamp: new Date().toISOString() }
      );
      
      throw new Error(`Failed to get plants exceeding threshold: ${error.message}`);
    }
  }

  async changeOilIntensity(
    plantId: number,
    data: UpdatePlantOilIntensityDTO
  ): Promise<PlantDTO | null> {
    try {
      console.log(`\x1b[35m[ProductionService]\x1b[0m Changing oil intensity for plant ID: ${plantId}`);

      await this.auditClient.logInfo(
        "PRODUCTION",
        "CHANGE_OIL_INTENSITY_STARTED",
        `Changing oil intensity for plant ID: ${plantId}`,
        { plantId, ...data, timestamp: new Date().toISOString() }
      );

      const plant = await this.plantRepository.findOne({ where: { id: plantId } });
      if (!plant) {
        console.warn(`\x1b[33m[ProductionService]\x1b[0m Plant not found: ${plantId}`);

        await this.auditClient.logWarning(
          "PRODUCTION",
          "CHANGE_OIL_INTENSITY_PLANT_NOT_FOUND",
          `Plant not found for oil intensity change: ${plantId}`,
          { plantId, ...data, timestamp: new Date().toISOString() }
        );

        return null;
      }

      const oldIntensity = plant.oilIntensity;
      plant.changeOilIntensity(data.percentage);
      const updatedPlant = await this.plantRepository.save(plant);

      // Production log
      await this.productionLogRepository.save({
        eventType: ProductionEventType.OIL_INTENSITY_CHANGE,
        description: `Changed oil intensity for plant ${plant.name}: ${oldIntensity.toFixed(2)} → ${plant.oilIntensity.toFixed(2)} (${data.percentage}%)`,
        details: {
          plantId,
          oldIntensity,
          newIntensity: plant.oilIntensity,
          percentage: data.percentage,
        },
        plant: updatedPlant,
        oilIntensity: plant.oilIntensity,
        userId: data.userId,
        successful: true,
      });

      // Audit
      await this.auditClient.logInfo(
        "PRODUCTION",
        "CHANGE_OIL_INTENSITY_SUCCESS",
        `Oil intensity changed for plant ${plant.name}: ${oldIntensity.toFixed(2)} → ${plant.oilIntensity.toFixed(2)}`,
        {
          plantId,
          plantName: plant.name,
          oldIntensity,
          newIntensity: plant.oilIntensity,
          percentage: data.percentage,
          userId: data.userId,
          timestamp: new Date().toISOString(),
        }
      );

      // Check if exceeded 4.00 threshold
      if (plant.oilIntensity > 4.0) {
        await this.productionLogRepository.save({
          eventType: ProductionEventType.WARNING,
          description: `WARNING: Oil intensity for plant ${plant.name} exceeded 4.00 threshold (current: ${plant.oilIntensity.toFixed(2)})`,
          plant: updatedPlant,
          oilIntensity: plant.oilIntensity,
          successful: true,
        });

        await this.auditClient.logWarning(
          "PRODUCTION",
          "OIL_INTENSITY_THRESHOLD_EXCEEDED",
          `Plant ${plant.name} oil intensity exceeded 4.00 threshold: ${plant.oilIntensity.toFixed(2)}`,
          {
            plantId,
            plantName: plant.name,
            intensity: plant.oilIntensity,
            threshold: 4.0,
            deviation: (plant.oilIntensity - 4.0).toFixed(2),
            percentageAbove: ((plant.oilIntensity - 4.0) / 4.0 * 100).toFixed(2),
            timestamp: new Date().toISOString(),
          }
        );

        console.warn(`\x1b[33m[ProductionService]\x1b[0m Plant ${plant.name} oil intensity exceeded 4.00 threshold: ${plant.oilIntensity.toFixed(2)}`);
        
        // Special case: if intensity is over 5.00, mark as problematic
        if (plant.oilIntensity > 5.0) {
          await this.productionLogRepository.save({
            eventType: ProductionEventType.ERROR,
            description: `CRITICAL: Oil intensity for plant ${plant.name} is dangerously high: ${plant.oilIntensity.toFixed(2)}`,
            plant: updatedPlant,
            oilIntensity: plant.oilIntensity,
            successful: false,
          });
        }
      }

      console.log(`\x1b[32m[ProductionService]\x1b[0m Oil intensity changed for plant ${plant.name}: ${oldIntensity.toFixed(2)} → ${plant.oilIntensity.toFixed(2)}`);
      return this.toPlantDTO(updatedPlant);
    } catch (error: any) {
      console.error(`\x1b[31m[ProductionService]\x1b[0m Failed to change oil intensity:`, error);

      await this.auditClient.logError(
        "PRODUCTION",
        "CHANGE_OIL_INTENSITY_FAILED",
        error,
        { plantId, ...data, timestamp: new Date().toISOString() }
      );

      throw new Error(`Failed to change oil intensity: ${error.message}`);
    }
  }

  async harvestPlants(
    plantId: number,
    data: HarvestPlantsDTO
  ): Promise<boolean> {
    try {
      console.log(`\x1b[35m[ProductionService]\x1b[0m Harvesting plants for plant ID: ${plantId}`);

      await this.auditClient.logInfo(
        "PRODUCTION",
        "HARVEST_PLANTS_STARTED",
        `Starting harvest for plant ID: ${plantId}`,
        { plantId, ...data, timestamp: new Date().toISOString() }
      );

      const plant = await this.plantRepository.findOne({ where: { id: plantId } });
      if (!plant) {
        console.warn(`\x1b[33m[ProductionService]\x1b[0m Plant not found: ${plantId}`);

        await this.auditClient.logWarning(
          "PRODUCTION",
          "HARVEST_PLANTS_PLANT_NOT_FOUND",
          `Plant not found for harvest: ${plantId}`,
          { plantId, ...data, timestamp: new Date().toISOString() }
        );

        return false;
      }

      let success: boolean;
      
      if (data.forProcessing) {
        // Harvest for processing
        success = plant.harvestForProcessing(data.quantity);
      } else {
        // Regular harvest
        success = plant.harvestForRegularUse(data.quantity);
      }

      if (!success) {
        await this.auditClient.logWarning(
          "PRODUCTION",
          "HARVEST_PLANTS_FAILED",
          `Harvest failed for plant ID ${plantId}`,
          { 
            plantId, 
            ...data, 
            availableForHarvest: plant.isReadyForHarvest(),
            availableQuantity: plant.quantity,
            timestamp: new Date().toISOString() 
          }
        );

        return false;
      }

      await this.plantRepository.save(plant);

      // Production log
      await this.productionLogRepository.save({
        eventType: ProductionEventType.HARVEST,
        description: data.forProcessing 
          ? `Harvested ${data.quantity} pieces of plant ${plant.name} for processing`
          : `Harvested ${data.quantity} pieces of plant ${plant.name}`,
        details: {
          plantId,
          remaining: plant.quantity,
          remainingForProcessing: plant.remainingForProcessing,
          forProcessing: data.forProcessing || false,
        },
        plant,
        quantity: data.quantity,
        userId: data.userId,
        successful: true,
      });

      // Audit
      await this.auditClient.logInfo(
        "PRODUCTION",
        "HARVEST_PLANTS_SUCCESS",
        data.forProcessing
          ? `Successfully harvested ${data.quantity} pieces of plant ${plant.name} for processing`
          : `Successfully harvested ${data.quantity} pieces of plant ${plant.name}`,
        {
          plantId,
          plantName: plant.name,
          harvestedQuantity: data.quantity,
          remainingQuantity: plant.quantity,
          remainingForProcessing: plant.remainingForProcessing,
          userId: data.userId,
          forProcessing: data.forProcessing,
          timestamp: new Date().toISOString(),
        }
      );

      console.log(`\x1b[32m[ProductionService]\x1b[0m Successfully harvested ${data.quantity} pieces of plant ${plant.name}`);
      return true;
    } catch (error: any) {
      console.error(`\x1b[31m[ProductionService]\x1b[0m Failed to harvest plants:`, error);

      await this.auditClient.logError(
        "PRODUCTION",
        "HARVEST_PLANTS_FAILED",
        error,
        { plantId, ...data, timestamp: new Date().toISOString() }
      );

      throw new Error(`Failed to harvest plants: ${error.message}`);
    }
  }

  async getProductionLogs(): Promise<ProductionLog[]> {
    try {
      console.log("\x1b[35m[ProductionService]\x1b[0m Getting production logs");

      // Audit: Operation
      await this.auditClient.logInfo(
        "PRODUCTION",
        "GET_PRODUCTION_LOGS",
        "Retrieving production logs",
        { timestamp: new Date().toISOString() }
      );

      const logs = await this.productionLogRepository.find({
        order: { dateTime: "DESC" },
        relations: ["plant"],
      });

      // Audit: Success with count
      await this.auditClient.logInfo(
        "PRODUCTION",
        "GET_PRODUCTION_LOGS_SUCCESS",
        `Retrieved ${logs.length} production logs`,
        { count: logs.length, timestamp: new Date().toISOString() }
      );

      return logs;
    } catch (error: any) {
      console.error(
        `\x1b[31m[ProductionService]\x1b[0m Failed to get production logs:`,
        error
      );

      // Audit: Error
      await this.auditClient.logError(
        "PRODUCTION",
        "GET_PRODUCTION_LOGS_FAILED",
        error,
        { timestamp: new Date().toISOString() }
      );

      throw new Error(`Failed to get production logs: ${error.message}`);
    }
  }

  async getLogsByPlantId(plantId: number): Promise<ProductionLog[]> {
    try {
      console.log(
        `\x1b[35m[ProductionService]\x1b[0m Getting logs for plant ID: ${plantId}`
      );

      // Audit: Operation
      await this.auditClient.logInfo(
        "PRODUCTION",
        "GET_LOGS_BY_PLANT_ID",
        `Retrieving logs for plant ID: ${plantId}`,
        { plantId, timestamp: new Date().toISOString() }
      );

      const logs = await this.productionLogRepository.find({
        where: { plant: { id: plantId } },
        order: { dateTime: "DESC" },
      });

      // Audit: Success with count
      await this.auditClient.logInfo(
        "PRODUCTION",
        "GET_LOGS_BY_PLANT_ID_SUCCESS",
        `Retrieved ${logs.length} logs for plant ID: ${plantId}`,
        { plantId, count: logs.length, timestamp: new Date().toISOString() }
      );

      return logs;
    } catch (error: any) {
      console.error(
        `\x1b[31m[ProductionService]\x1b[0m Failed to get logs for plant ID ${plantId}:`,
        error
      );

      // Audit: Error
      await this.auditClient.logError(
        "PRODUCTION",
        "GET_LOGS_BY_PLANT_ID_FAILED",
        error,
        { plantId, timestamp: new Date().toISOString() }
      );

      throw new Error(`Failed to get plant logs: ${error.message}`);
    }
  }

  async requestNewPlantForProcessing(
    processedPlantId: number,
    processedIntensity: number
  ): Promise<PlantDTO | null> {
    try {
      console.log(`\x1b[35m[ProductionService]\x1b[0m Requesting new plant for processing balance from plant ID: ${processedPlantId}`);

      await this.auditClient.logInfo(
        "PRODUCTION",
        "REQUEST_NEW_PLANT_STARTED",
        `Requesting new plant for processing balance from plant ID: ${processedPlantId}`,
        {
          processedPlantId,
          processedIntensity,
          timestamp: new Date().toISOString(),
        }
      );

      const processedPlant = await this.plantRepository.findOne({
        where: { id: processedPlantId },
      });
      
      if (!processedPlant) {
        console.warn(`\x1b[33m[ProductionService]\x1b[0m Processed plant not found: ${processedPlantId}`);

        await this.auditClient.logWarning(
          "PRODUCTION",
          "REQUEST_NEW_PLANT_PLANT_NOT_FOUND",
          `Processed plant not found: ${processedPlantId}`,
          {
            processedPlantId,
            processedIntensity,
            timestamp: new Date().toISOString(),
          }
        );

        return null;
      }

      // Create new plant
      const newPlant = new Plant();
      newPlant.name = processedPlant.name;
      newPlant.latinName = processedPlant.latinName;
      newPlant.countryOfOrigin = processedPlant.countryOfOrigin;
      newPlant.oilIntensity = this.generateRandomOilIntensity();
      newPlant.state = PlantState.PLANTED;
      newPlant.quantity = 1;
      newPlant.availableForHarvest = false;
      newPlant.remainingForProcessing = 1; // For processing
      
      // Adjust intensity based on processed plant
      newPlant.adjustOilIntensityBasedOnProcessed(processedIntensity);

      const savedPlant = await this.plantRepository.save(newPlant);

      // Production log
      await this.productionLogRepository.save({
        eventType: ProductionEventType.PLANTING,
        description: `Planted new plant for processing balance: ${newPlant.name}. Adjusted intensity based on processed plant (${processedIntensity})`,
        details: {
          originalPlantId: processedPlantId,
          processedIntensity,
          newPlantIntensity: newPlant.oilIntensity,
          adjustmentApplied: true,
        },
        plant: savedPlant,
        quantity: 1,
        oilIntensity: newPlant.oilIntensity,
        successful: true,
        source: "PROCESSING_SERVICE",
      });

      // Audit
      await this.auditClient.logInfo(
        "PRODUCTION",
        "REQUEST_NEW_PLANT_SUCCESS",
        `New plant created for processing balance: ${newPlant.name} (ID: ${savedPlant.id})`,
        {
          originalPlantId: processedPlantId,
          newPlantId: savedPlant.id,
          newPlantName: newPlant.name,
          processedIntensity,
          newPlantIntensity: newPlant.oilIntensity,
          intensityDeviation: processedIntensity - 4.0,
          adjustmentPercentage: ((processedIntensity - 4.0) / 4.0 * 100).toFixed(2),
          timestamp: new Date().toISOString(),
        }
      );

      console.log(`\x1b[32m[ProductionService]\x1b[0m New plant created for processing balance: ${newPlant.name} (ID: ${savedPlant.id})`);
      return this.toPlantDTO(savedPlant);
    } catch (error: any) {
      console.error(`\x1b[31m[ProductionService]\x1b[0m Failed to plant new plant for processing balance:`, error);

      await this.auditClient.logError(
        "PRODUCTION",
        "REQUEST_NEW_PLANT_FAILED",
        error,
        {
          processedPlantId,
          processedIntensity,
          timestamp: new Date().toISOString(),
        }
      );

      throw new Error(`Failed to request new plant for processing: ${error.message}`);
    }
  }

  private toPlantDTO(plant: Plant): PlantDTO {
    return {
      id: plant.id,
      name: plant.name,
      oilIntensity: Math.round(plant.oilIntensity * 100) / 100,
      latinName: plant.latinName,
      countryOfOrigin: plant.countryOfOrigin,
      state: plant.state,
      quantity: plant.quantity,
      remainingForProcessing: plant.remainingForProcessing,
      availableForHarvest: plant.isReadyForHarvest(),
      harvestAvailableDate: plant.harvestAvailableDate,
      createdAt: plant.createdAt,
    };
  }

  generateRandomOilIntensity(): number {
    const intensity = Math.round((Math.random() * 4 + 1) * 100) / 100; // 1.00 - 5.00
    console.log(`\x1b[35m[ProductionService]\x1b[0m Generated random oil intensity: ${intensity}`);
    return intensity;
  }
}