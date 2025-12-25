export interface HarvestPlantsDTO {
  plantId: number;
  quantity: number;
  forProcessing?: boolean;
  userId?: number;
}