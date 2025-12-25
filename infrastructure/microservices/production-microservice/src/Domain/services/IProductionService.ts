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
  changeOilIntensity(data: UpdatePlantOilIntensityDTO): Promise<PlantDTO | null>;
  harvestPlants(data: HarvestPlantsDTO): Promise<boolean>;
  getAvailablePlants(): Promise<PlantDTO[]>;
  getPlantsForProcessing(): Promise<PlantDTO[]>;
  
  // Log operations
  getProductionLogs(): Promise<ProductionLog[]>;
  getLogsByPlantId(plantId: number): Promise<ProductionLog[]>;
  
  // Special operations from spec
  requestNewPlantForProcessing(processedPlantId: number, processedIntensity: number): Promise<PlantDTO | null>;
  generateRandomOilIntensity(): number;
}