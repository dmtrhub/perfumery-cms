import { IsString, MinLength, IsEmail, IsEnum, IsOptional } from "class-validator";
import { UserRole } from "../enums/UserRole";

export class RegistrationUserDTO {
  @IsString()
  @MinLength(3)
  username!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsEmail()
  email!: string;

  @IsString()
  firstName!: string;

  @IsString()
  lastName!: string;

  @IsEnum(UserRole)
  role!: UserRole;

  @IsString()
  @IsOptional()
  profilePicture?: string;
}