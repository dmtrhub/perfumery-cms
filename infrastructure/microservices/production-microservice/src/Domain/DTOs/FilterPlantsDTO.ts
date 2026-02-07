import { IsEnum, IsOptional, IsString } from "class-validator";
import { PlantStatus } from "../enums/PlantStatus";

export class FilterPlantsDTO {
  @IsEnum(PlantStatus)
  @IsOptional()
  status?: PlantStatus;

  @IsString()
  @IsOptional()
  commonName?: string;
}