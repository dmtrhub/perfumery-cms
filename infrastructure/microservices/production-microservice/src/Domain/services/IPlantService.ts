import { Plant } from "../models/Plant";
import { CreatePlantDTO } from "../DTOs/CreatePlantDTO";
import { FilterPlantsDTO } from "../DTOs/FilterPlantsDTO";
import { HarvestPlantsDTO } from "../DTOs/HarvestPlantsDTO";
import { PlantBalanceDTO } from "../DTOs/PlantBalanceDTO";

export interface IPlantService {
  // CRUD
  createPlant(dto: CreatePlantDTO): Promise<Plant>;
  getPlantById(id: string): Promise<Plant>;
  getAllPlants(filters?: FilterPlantsDTO): Promise<Plant[]>;
  updatePlant(id: string, dto: CreatePlantDTO): Promise<Plant>;
  deletePlant(id: string): Promise<void>;

  // Business logic
  harvestPlants(dto: HarvestPlantsDTO): Promise<Plant[]>;
  adjustOilStrength(id: string, percentage: number): Promise<Plant>;
  getAvailablePlants(commonName: string): Promise<Plant[]>;
  markAsProcessed(plantIds: string[]): Promise<void>;
  checkOilStrengthBalance(plant: Plant): Promise<PlantBalanceDTO>;
}