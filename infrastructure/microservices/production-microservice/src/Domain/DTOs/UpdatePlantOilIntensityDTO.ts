export interface UpdatePlantOilIntensityDTO {
  plantId: number;
  percentage: number; // Positive for increase, negative for decrease
  userId?: number;
}