import { IsArray, ArrayMinSize, IsUUID } from "class-validator";

export class MarkAsProcessedDTO {
  @IsArray()
  @ArrayMinSize(1, { message: "At least one plant ID is required" })
  @IsUUID("all", { each: true })
  plantIds!: string[];
}