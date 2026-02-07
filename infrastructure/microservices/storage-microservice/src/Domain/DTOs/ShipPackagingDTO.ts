import { IsUUID, IsNotEmpty } from "class-validator";

export class ShipPackagingDTO {
  @IsUUID()
  @IsNotEmpty({ message: "Packaging ID is required" })
  packagingId!: string;
}
