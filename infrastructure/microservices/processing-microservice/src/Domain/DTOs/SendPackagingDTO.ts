import { IsUUID, IsNotEmpty } from "class-validator";

export class SendPackagingDTO {
  @IsUUID()
  @IsNotEmpty({ message: "Packaging ID is required" })
  packagingId!: string;
}