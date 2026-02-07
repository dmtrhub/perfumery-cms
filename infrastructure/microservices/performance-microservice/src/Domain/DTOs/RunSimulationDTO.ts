import { IsEnum } from "class-validator";
import { AlgorithmEnum } from "../enums/AlgorithmEnum";

export class RunSimulationDTO {
  @IsEnum(AlgorithmEnum)
  algorithmName!: AlgorithmEnum;
}
