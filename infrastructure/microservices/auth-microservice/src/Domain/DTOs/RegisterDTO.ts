import { IsString, IsNotEmpty, IsEmail, MinLength, IsEnum, IsOptional } from "class-validator";
import { UserRole } from "../enums/UserRole";

export class RegisterDTO {
  @IsString()
  @IsNotEmpty()
  username!: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(6)
  password!: string;

  @IsEmail()
  @IsNotEmpty()
  email!: string;

  @IsString()
  @IsNotEmpty()
  firstName!: string;

  @IsString()
  @IsNotEmpty()
  lastName!: string;

  @IsEnum(UserRole)
  @IsNotEmpty()
  role!: UserRole;

  @IsString()
  @IsOptional()
  profilePicture?: string;
}
