import { IsString, IsEmail, IsOptional, IsEnum } from "class-validator";
import { UserRole } from "../enums/UserRole";

export class CreateUserDTO {
  @IsString()
  username!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @IsOptional()
  firstName?: string;

  @IsString()
  @IsOptional()
  lastName?: string;

  @IsEnum(UserRole)
  role!: UserRole;

  @IsString()
  @IsOptional()
  profilePicture?: string;
}
