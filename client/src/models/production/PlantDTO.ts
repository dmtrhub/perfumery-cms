import { PlantStatus } from "../../enums/PlantStatus";

export interface PlantDTO {
  id: string;
  commonName: string;
  latinName: string;
  originCountry: string;
  aromaticOilStrength: number;
  status: PlantStatus;
  createdAt: string;
  updatedAt: string;
}

export interface CreatePlantDTO {
  commonName: string;
  latinName: string;
  originCountry: string;
  aromaticOilStrength?: number;
}

export interface HarvestPlantsDTO {
  commonName: string;
  count: number;
}

export interface AdjustOilIntensityDTO {
  percentage: number;
}
