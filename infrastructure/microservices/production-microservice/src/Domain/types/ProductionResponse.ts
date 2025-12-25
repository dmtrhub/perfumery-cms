export type ProductionResponse<T = any> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
};

export type PlantResponse = ProductionResponse<{
  id: number;
  name: string;
  oilIntensity: number;
  state: string;
  quantity: number;
}>;

export type ProductionLogsResponse = ProductionResponse<Array<{
  id: number;
  eventType: string;
  description: string;
  dateTime: Date;
  successful: boolean;
  plantName?: string;
}>>;