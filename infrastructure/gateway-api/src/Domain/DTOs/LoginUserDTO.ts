import { IsString, MinLength, IsEmail, IsEnum, IsOptional } from "class-validator";

export class LoginUserDTO {
  @IsString()
  @MinLength(3)
  username!: string;

  @IsString()
  @MinLength(6)
  password!: string;
}