import { IsEnum, IsOptional } from "class-validator";
import { PerfumeType } from "../enums/PerfumeType";
import { PerfumeStatus } from "../enums/PerfumeStatus";

export class FilterPerfumesDTO {
  @IsEnum(PerfumeType)
  @IsOptional()
  type?: PerfumeType;

  @IsEnum(PerfumeStatus)
  @IsOptional()
  status?: PerfumeStatus;
}