import { IsString, IsNotEmpty, IsNumber, IsEnum, Min } from "class-validator";
import { WarehouseType } from "../enums/WarehouseType";

export class CreateWarehouseDTO {
  @IsString()
  @IsNotEmpty({ message: "Warehouse name is required" })
  name!: string;

  @IsString()
  @IsNotEmpty({ message: "Location is required" })
  location!: string;

  @IsNumber()
  @IsNotEmpty({ message: "Max capacity is required" })
  @Min(1, { message: "Max capacity must be at least 1" })
  maxCapacity!: number;

  @IsEnum(WarehouseType)
  @IsNotEmpty({ message: "Warehouse type is required" })
  type!: WarehouseType;
}
