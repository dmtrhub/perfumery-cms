export interface CreatePlantDTO {
  commonName: string;
  oilIntensity?: number; // 1.0 - 5.0 (optional)
  latinName?: string;
  countryOfOrigin: string;
  status?: "PLANTED" | "HARVESTED" | "PROCESSED"; // "PLANTED"
  plantedDate?: Date;
  harvestDate?: Date;
  processedDate?: Date;
  notes?: string;
  createdBy?: number; // User ID who created the plant entry
}