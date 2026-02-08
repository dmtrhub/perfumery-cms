import { PlantDTO, CreatePlantDTO, HarvestPlantsDTO, AdjustOilIntensityDTO } from "../../models/production/PlantDTO";

export interface IProductionAPI {
  getAllPlants(token: string, status?: string, commonName?: string): Promise<PlantDTO[]>;
  getPlantById(token: string, id: string): Promise<PlantDTO>;
  createPlant(token: string, data: CreatePlantDTO): Promise<any>;
  updatePlant(token: string, id: string, data: CreatePlantDTO): Promise<any>;
  deletePlant(token: string, id: string): Promise<any>;
  harvestPlants(token: string, data: HarvestPlantsDTO): Promise<any>;
  adjustOilStrength(token: string, id: string, data: AdjustOilIntensityDTO): Promise<any>;
  markProcessed(token: string, plantIds: string[]): Promise<any>;
}
