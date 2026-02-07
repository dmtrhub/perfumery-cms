import { PlantDTO } from "../Domain/DTOs/PlantDTO";

export interface IProductionClient {
  harvestPlants(commonName: string, count: number): Promise<PlantDTO[]>;
  createPlant(commonName: string, latinName: string, originCountry: string): Promise<PlantDTO>;
  adjustOilStrength(plantId: string, percentage: number): Promise<PlantDTO>;
  markAsProcessed(plantIds: string[]): Promise<void>;
}