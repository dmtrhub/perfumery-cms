import { PerfumeType } from "../enums/PerfumeType";
import { BottleSize } from "../enums/BottleSize";

export interface PackagingRequestDTO {
  perfumeType: PerfumeType;
  quantity: number;
  bottleSize?: BottleSize;
  destinationWarehouse?: string;
  userId?: number;
  externalRequestId?: string;
}