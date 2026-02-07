import { IsUUID, IsNotEmpty } from "class-validator";

/**
 * DTO za primanje ambalaže od Processing-a
 */
export class ReceivePackagingDTO {
  @IsUUID()
  @IsNotEmpty({ message: "Packaging ID is required" })
  packagingId!: string;
}
