import { IsString, IsNotEmpty, IsOptional, MaxLength, Min, Max, IsNumber } from "class-validator";

export class CreatePlantDTO {
  @IsString()
  @IsNotEmpty({ message: "Common name is required" })
  @MaxLength(100, { message: "Common name must not exceed 100 characters" })
  commonName!: string;

  @IsString()
  @IsNotEmpty({ message: "Latin name is required" })
  @MaxLength(100, { message: "Latin name must not exceed 100 characters" })
  latinName!: string;

  @IsString()
  @IsNotEmpty({ message: "Origin country is required" })
  @MaxLength(100, { message: "Origin country must not exceed 100 characters" })
  originCountry!: string;

  @IsNumber()
  @IsOptional()
  @Min(1.0, { message: "Aromatic oil strength must be at least 1.0" })
  @Max(5.0, { message: "Aromatic oil strength must not exceed 5.0" })
  aromaticOilStrength?: number;
}