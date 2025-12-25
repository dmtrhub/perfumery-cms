import { Repository, MoreThan } from "typeorm";
import { Plant } from "../Domain/models/Plant";
import { PlantState } from "../Domain/enums/PlantState";
import { ProductionLog } from "../Domain/models/ProductionLog";
import { ProductionEventType } from "../Domain/enums/ProductionEventType";
import { IProductionService } from "../Domain/services/IProductionService";
import { PlantDTO } from "../Domain/DTOs/PlantDTO";
import { CreatePlantDTO } from "../Domain/DTOs/CreatePlantDTO";
import { UpdatePlantOilIntensityDTO } from "../Domain/DTOs/UpdatePlantOilIntensityDTO";
import { HarvestPlantsDTO } from "../Domain/DTOs/HarvestPlantsDTO";

export class ProductionService implements IProductionService {
  constructor(
    private plantRepository: Repository<Plant>,
    private productionLogRepository: Repository<ProductionLog>
  ) {
    console.log("\x1b[35m[ProductionService@1.0.0]\x1b[0m Service started");
  }

  async createPlant(data: CreatePlantDTO): Promise<PlantDTO> {
    try {
      console.log(`\x1b[35m[ProductionService]\x1b[0m Creating plant: ${data.name}`);

      const oilIntensity = data.oilIntensity || this.generateRandomOilIntensity();

      const newPlant = new Plant();
      newPlant.name = data.name;
      newPlant.latinName = data.latinName;
      newPlant.countryOfOrigin = data.countryOfOrigin;
      newPlant.oilIntensity = oilIntensity;
      newPlant.state = PlantState.PLANTED;
      newPlant.quantity = data.quantity;
      newPlant.availableForHarvest = false;

      const savedPlant = await this.plantRepository.save(newPlant);

      await this.productionLogRepository.save({
        eventType: ProductionEventType.PLANTING,
        description: `Planted new plant: ${data.name} (${data.quantity} pieces)`,
        details: { plantId: savedPlant.id, oilIntensity, quantity: data.quantity },
        plant: savedPlant,
        quantity: data.quantity,
        oilIntensity: oilIntensity,
        userId: data.userId,
        successful: true,
        source: data.userId ? "CLIENT" : "PROCESSING_SERVICE"
      });

      console.log(`\x1b[32m[ProductionService]\x1b[0m Plant created: ${data.name} (ID: ${savedPlant.id})`);
      return this.toPlantDTO(savedPlant);
    } catch (error) {
      console.error(`\x1b[31m[ProductionService]\x1b[0m Failed to plant ${data.name}:`, error);
      throw new Error(`Failed to create plant: ${error}`);
    }
  }

  async getAllPlants(): Promise<PlantDTO[]> {
    console.log("\x1b[35m[ProductionService]\x1b[0m Getting all plants");
    const plants = await this.plantRepository.find();
    return plants.map(plant => this.toPlantDTO(plant));
  }

  async getPlantById(id: number): Promise<PlantDTO | null> {
    console.log(`\x1b[35m[ProductionService]\x1b[0m Getting plant by ID: ${id}`);
    const plant = await this.plantRepository.findOne({ where: { id } });
    return plant ? this.toPlantDTO(plant) : null;
  }

  async changeOilIntensity(data: UpdatePlantOilIntensityDTO): Promise<PlantDTO | null> {
    try {
      console.log(`\x1b[35m[ProductionService]\x1b[0m Changing oil intensity for plant ID: ${data.plantId}`);
      
      const plant = await this.plantRepository.findOne({ where: { id: data.plantId } });
      if (!plant) {
        console.warn(`\x1b[33m[ProductionService]\x1b[0m Plant not found: ${data.plantId}`);
        return null;
      }

      const oldIntensity = plant.oilIntensity;
      plant.changeOilIntensity(data.percentage);
      const updatedPlant = await this.plantRepository.save(plant);

      await this.productionLogRepository.save({
        eventType: ProductionEventType.OIL_INTENSITY_CHANGE,
        description: `Changed oil intensity for plant ${plant.name}: ${oldIntensity} → ${plant.oilIntensity} (${data.percentage}%)`,
        details: { plantId: plant.id, oldIntensity, newIntensity: plant.oilIntensity, percentage: data.percentage },
        plant: updatedPlant,
        oilIntensity: plant.oilIntensity,
        userId: data.userId,
        successful: true
      });

      if (plant.oilIntensity > 4.00) {
        await this.productionLogRepository.save({
          eventType: ProductionEventType.INFO,
          description: `WARNING: Oil intensity for plant ${plant.name} exceeded 4.00 (current: ${plant.oilIntensity})`,
          plant: updatedPlant,
          oilIntensity: plant.oilIntensity,
          successful: true
        });
        console.warn(`\x1b[33m[ProductionService]\x1b[0m Plant ${plant.name} oil intensity exceeded 4.00 threshold: ${plant.oilIntensity}`);
      }

      console.log(`\x1b[32m[ProductionService]\x1b[0m Oil intensity changed for plant ${plant.name}: ${oldIntensity} → ${plant.oilIntensity}`);
      return this.toPlantDTO(updatedPlant);
    } catch (error) {
      console.error(`\x1b[31m[ProductionService]\x1b[0m Failed to change oil intensity:`, error);
      throw new Error(`Failed to change oil intensity: ${error}`);
    }
  }

  async harvestPlants(data: HarvestPlantsDTO): Promise<boolean> {
    try {
      console.log(`\x1b[35m[ProductionService]\x1b[0m Harvesting plants for plant ID: ${data.plantId}`);
      
      const plant = await this.plantRepository.findOne({ where: { id: data.plantId } });
      if (!plant || !plant.availableForHarvest || plant.quantity < data.quantity) {
        console.warn(`\x1b[33m[ProductionService]\x1b[0m Cannot harvest plants for plant ID ${data.plantId}`);
        return false;
      }

      const success = plant.harvestQuantity(data.quantity);
      if (!success) return false;

      if (plant.state === PlantState.PLANTED && plant.quantity === 0) {
        plant.markAsHarvested();
      }

      await this.plantRepository.save(plant);

      await this.productionLogRepository.save({
        eventType: ProductionEventType.HARVEST,
        description: `Harvested ${data.quantity} pieces of plant ${plant.name}`,
        details: { plantId: plant.id, remaining: plant.quantity, remainingForProcessing: plant.remainingForProcessing, forProcessing: data.forProcessing || false },
        plant,
        quantity: data.quantity,
        userId: data.userId,
        successful: true
      });

      console.log(`\x1b[32m[ProductionService]\x1b[0m Successfully harvested ${data.quantity} pieces of plant ${plant.name}`);
      return true;
    } catch (error) {
      console.error(`\x1b[31m[ProductionService]\x1b[0m Failed to harvest plants:`, error);
      throw new Error(`Failed to harvest plants: ${error}`);
    }
  }

  async getPlantsForProcessing(): Promise<PlantDTO[]> {
    console.log("\x1b[35m[ProductionService]\x1b[0m Getting plants for processing");
    const plants = await this.plantRepository.find({
      where: { remainingForProcessing: MoreThan(0) }
    });
    return plants.map(plant => this.toPlantDTO(plant));
  }

  async getAvailablePlants(): Promise<PlantDTO[]> {
    console.log("\x1b[35m[ProductionService]\x1b[0m Getting available plants");
    const plants = await this.plantRepository.find({
      where: { availableForHarvest: true, quantity: MoreThan(0) }
    });
    return plants.map(plant => this.toPlantDTO(plant));
  }

  async getProductionLogs(): Promise<ProductionLog[]> {
    console.log("\x1b[35m[ProductionService]\x1b[0m Getting production logs");
    return await this.productionLogRepository.find({
      order: { dateTime: "DESC" },
      relations: ["plant"]
    });
  }

  async getLogsByPlantId(plantId: number): Promise<ProductionLog[]> {
    console.log(`\x1b[35m[ProductionService]\x1b[0m Getting logs for plant ID: ${plantId}`);
    return await this.productionLogRepository.find({
      where: { plant: { id: plantId } },
      order: { dateTime: "DESC" }
    });
  }

  async requestNewPlantForProcessing(processedPlantId: number, processedIntensity: number): Promise<PlantDTO | null> {
    try {
      console.log(`\x1b[35m[ProductionService]\x1b[0m Requesting new plant for processing balance from plant ID: ${processedPlantId}`);
      
      const processedPlant = await this.plantRepository.findOne({ where: { id: processedPlantId } });
      if (!processedPlant) {
        console.warn(`\x1b[33m[ProductionService]\x1b[0m Processed plant not found: ${processedPlantId}`);
        return null;
      }

      const newPlant = new Plant();
      newPlant.name = processedPlant.name;
      newPlant.latinName = processedPlant.latinName;
      newPlant.countryOfOrigin = processedPlant.countryOfOrigin;
      newPlant.oilIntensity = this.generateRandomOilIntensity();
      newPlant.state = PlantState.PLANTED;
      newPlant.quantity = 1;
      newPlant.availableForHarvest = false;
      newPlant.adjustOilIntensityBasedOnProcessed(processedIntensity);

      const savedPlant = await this.plantRepository.save(newPlant);

      await this.productionLogRepository.save({
        eventType: ProductionEventType.PLANTING,
        description: `Planted new plant for processing balance: ${newPlant.name}. Adjusted intensity based on processed plant (${processedIntensity})`,
        details: { originalPlantId: processedPlantId, processedIntensity, newPlantIntensity: newPlant.oilIntensity },
        plant: savedPlant,
        quantity: 1,
        oilIntensity: newPlant.oilIntensity,
        successful: true,
        source: "PROCESSING_SERVICE"
      });

      console.log(`\x1b[32m[ProductionService]\x1b[0m New plant created for processing balance: ${newPlant.name} (ID: ${savedPlant.id})`);
      return this.toPlantDTO(savedPlant);
    } catch (error) {
      console.error(`\x1b[31m[ProductionService]\x1b[0m Failed to plant new plant for processing balance:`, error);
      throw new Error(`Failed to request new plant for processing: ${error}`);
    }
  }

  generateRandomOilIntensity(): number {
    const intensity = Math.round((Math.random() * 4 + 1) * 100) / 100;
    console.log(`\x1b[35m[ProductionService]\x1b[0m Generated random oil intensity: ${intensity}`);
    return intensity;
  }

  private toPlantDTO(plant: Plant): PlantDTO {
    return {
      id: plant.id,
      name: plant.name,
      oilIntensity: plant.oilIntensity,
      latinName: plant.latinName,
      countryOfOrigin: plant.countryOfOrigin,
      state: plant.state,
      quantity: plant.quantity,
      remainingForProcessing: plant.remainingForProcessing,
      availableForHarvest: plant.availableForHarvest,
      createdAt: plant.createdAt
    };
  }
}