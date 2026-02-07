import { IsString, IsNotEmpty, IsNumber, Min } from "class-validator";

export class HarvestPlantsDTO {
  @IsString()
  @IsNotEmpty({ message: "Common name is required" })
  commonName!: string;

  @IsNumber()
  @IsNotEmpty({ message: "Count is required" })
  @Min(1, { message: "Count must be at least 1" })
  count!: number;
}