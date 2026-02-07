import { IsString, IsNotEmpty } from "class-validator";

export class VerifyDTO {
  @IsString()
  @IsNotEmpty()
  token!: string;
}
