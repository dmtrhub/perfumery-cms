import {
  IsEnum,
  IsOptional,
  IsString,
} from "class-validator";
import { UserRole } from "../enums/UserRole";

export class FilterUsersDTO {
  @IsOptional()
  @IsString()
  search?: string;

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;
}