import { PlantState } from "../enums/PlantState";

export interface PlantDTO {
  id: number;
  name: string;
  oilIntensity: number;
  latinName: string;
  countryOfOrigin: string;
  state: PlantState;
  quantity: number;
  remainingForProcessing: number;
  availableForHarvest: boolean;
  harvestAvailableDate?: Date;
  createdAt: Date;
}