import { IsString, IsNotEmpty, IsNumber, IsEnum, Min, Max } from "class-validator";
import { PerfumeType } from "../enums/PerfumeType";

export class StartProcessingDTO {
  @IsString()
  @IsNotEmpty({ message: "Perfume name is required" })
  perfumeName!: string;

  @IsNumber()
  @IsNotEmpty({ message: "Count is required" })
  @Min(1, { message: "Count must be at least 1" })
  count!: number;

  @IsNumber()
  @IsNotEmpty({ message: "Bottle size is required" })
  @IsEnum([150, 250], { message: "Bottle size must be 150 or 250 ml" })
  bottleSize!: number;

  @IsEnum(PerfumeType)
  @IsNotEmpty({ message: "Perfume type is required" })
  type!: PerfumeType;

  @IsString()
  @IsNotEmpty({ message: "Plant common name is required" })
  plantCommonName!: string;
}