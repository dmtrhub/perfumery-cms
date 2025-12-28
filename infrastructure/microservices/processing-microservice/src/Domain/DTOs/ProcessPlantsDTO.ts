import { PerfumeType } from "../enums/PerfumeType";
import { BottleSize } from "../enums/BottleSize";
import { SourceType } from "../enums/SourceType";

export interface ProcessPlantsDTO {
  perfumeType: PerfumeType;
  bottleSize: BottleSize;
  bottleCount: number;
  userId?: number;
  source?: SourceType;
  externalRequestId?: string;
  metadata?: Record<string, any>;
}