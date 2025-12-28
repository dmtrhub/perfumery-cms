export type ProcessingResponse<T = any> = {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  timestamp?: string;
};

export type PerfumeResponse = ProcessingResponse<{
  id: number;
  name: string;
  type: string;
  bottleSize: number;
  quantity: number;
  availableQuantity: number;
  reservedQuantity: number;
  totalVolumeMl: number;
  createdAt: Date;
}>;

export type ProcessingBatchResponse = ProcessingResponse<{
  id: number;
  perfumeType: string;
  bottleCount: number;
  plantsNeeded: number;
  status: string;
  source: string;
  startedAt: Date;
  completedAt?: Date;
  estimatedCompletion?: Date;
}>;

export type PackagingResponse = ProcessingResponse<{
  id: number;
  perfumeType: string;
  quantity: number;
  status: string;
  warehouseLocation?: string;
  trackingNumber?: string;
  packagedAt: Date;
  shippedAt?: Date;
}>;

export type InventoryResponse = ProcessingResponse<Array<{
  type: string;
  available: number;
  reserved: number;
  total: number;
  bottleSize: number;
  totalVolumeMl: number;
}>>;

export type ProcessingLogsResponse = ProcessingResponse<Array<{
  id: number;
  eventType: string;
  description: string;
  dateTime: Date;
  successful: boolean;
  perfumeName?: string;
  batchId?: number;
  source?: string;
}>>;

export type ValidationResult = {
  valid: boolean;
  errors?: string[];
};

export type PlantsCalculationResult = {
  bottleCount: number;
  bottleSize: number;
  totalMl: number;
  plantsNeeded: number;
  plantsPerBottle: number;
};

export type BatchProcessingTime = {
  batchId: number;
  bottlesPerSecond: number;
  estimatedCompletion: Date;
  progressPercentage: number;
};