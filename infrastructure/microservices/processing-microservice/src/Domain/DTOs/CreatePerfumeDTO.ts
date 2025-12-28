import { PerfumeType } from "../enums/PerfumeType";
import { BottleSize } from "../enums/BottleSize";

export interface CreatePerfumeDTO {
  name: string;
  type: PerfumeType;
  bottleSize: BottleSize;
  initialQuantity?: number;
  userId?: number;
}