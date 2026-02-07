import {
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export class UpdateUserDTO {
  @IsOptional()
  @IsString()
  @MaxLength(50)
  firstName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  lastName?: string;

  @IsOptional()
  @IsEmail({}, { message: "Invalid email format" })
  @MaxLength(100)
  email?: string;

  @IsOptional()
  @IsString()
  profilePicture?: string;
}
