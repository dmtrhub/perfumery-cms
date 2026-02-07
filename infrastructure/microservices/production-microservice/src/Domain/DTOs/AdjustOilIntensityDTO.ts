import { IsNumber, IsNotEmpty, Min, Max } from "class-validator";

export class AdjustOilIntensityDTO {
  @IsNumber()
  @IsNotEmpty({ message: "Percentage is required" })
  @Min(-100, { message: "Percentage must be at least -100%" })
  @Max(100, { message: "Percentage must not exceed 100%" })
  percentage!: number;
}