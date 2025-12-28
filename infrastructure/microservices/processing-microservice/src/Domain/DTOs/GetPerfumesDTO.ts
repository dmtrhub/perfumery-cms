import { PerfumeType } from "../enums/PerfumeType";

export interface GetPerfumesDTO {
  type?: PerfumeType;
  minQuantity?: number;
  includeReserved?: boolean;
  bottleSize?: number;
}