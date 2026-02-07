import { IsString, IsNotEmpty, IsUUID, IsArray, ArrayMinSize } from "class-validator";

export class CreatePackagingDTO {
  @IsString()
  @IsNotEmpty({ message: "Packaging name is required" })
  name!: string;

  @IsString()
  @IsNotEmpty({ message: "Sender address is required" })
  senderAddress!: string;

  @IsUUID()
  @IsNotEmpty({ message: "Warehouse ID is required" })
  warehouseId!: string;

  @IsArray()
  @ArrayMinSize(1, { message: "At least one perfume ID is required" })
  @IsUUID("all", { each: true })
  perfumeIds!: string[];
}