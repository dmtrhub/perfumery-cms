export interface CreatePlantDTO {
  name: string;
  latinName: string;
  countryOfOrigin: string;
  quantity: number;
  oilIntensity?: number; // Optional, if not provided generates randomly
  userId?: number;
  forProcessing?: boolean;
}