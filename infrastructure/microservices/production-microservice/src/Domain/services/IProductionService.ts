import { PlantDTO } from "../DTOs/PlantDTO";
import { CreatePlantDTO } from "../DTOs/CreatePlantDTO";
import { UpdatePlantOilIntensityDTO } from "../DTOs/UpdatePlantOilIntensityDTO";
import { HarvestPlantsDTO } from "../DTOs/HarvestPlantsDTO";
import { ProductionLog } from "../models/ProductionLog";

export interface IProductionService {
  // Plant operations
  createPlant(data: CreatePlantDTO): Promise<PlantDTO>;
  getAllPlants(): Promise<PlantDTO[]>;
  getPlantById(id: number): Promise<PlantDTO | null>;
  
  // Plant management
  changeOilIntensity(plantId: number, data: UpdatePlantOilIntensityDTO): Promise<PlantDTO | null>;
  harvestPlants(plantId: number, data: HarvestPlantsDTO): Promise<boolean>;
  
  // Plant queries
  getAvailablePlants(): Promise<PlantDTO[]>;
  getPlantsForProcessing(): Promise<PlantDTO[]>;
  getPlantsExceedingThreshold(): Promise<PlantDTO[]>;
  
  // Log operations
  getProductionLogs(): Promise<ProductionLog[]>;
  getLogsByPlantId(plantId: number): Promise<ProductionLog[]>;
  
  // Processing balance
  requestNewPlantForProcessing(processedPlantId: number, processedIntensity: number): Promise<PlantDTO | null>;
}