import { IsNumber, Min, IsEnum, IsNotEmpty, ValidateIf, registerDecorator, ValidationOptions, ValidationArguments } from "class-validator";

export enum UserRole {
  SALES_MANAGER = "SALES_MANAGER",
  SALESPERSON = "SALESPERSON"
}

// Custom validator za count na osnovu uloge
function IsValidCountForRole(validationOptions?: ValidationOptions) {
  return function (target: Object, propertyName: string) {
    registerDecorator({
      name: 'isValidCountForRole',
      target: target.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          const dto = args.object as SendToSalesDTO;
          
          if (dto.userRole === UserRole.SALESPERSON && value > 1) {
            return false;
          }
          if (dto.userRole === UserRole.SALES_MANAGER && value > 3) {
            return false;
          }
          return true;
        },
        defaultMessage(args: ValidationArguments) {
          const dto = args.object as SendToSalesDTO;
          if (dto.userRole === UserRole.SALESPERSON) {
            return 'Salesperson može zahtevati maksimalno 1 pakovanje';
          }
          if (dto.userRole === UserRole.SALES_MANAGER) {
            return 'Sales Manager može zahtevati maksimalno 3 pakovanja';
          }
          return 'Invalid count for user role';
        }
      }
    });
  };
}

export class SendToSalesDTO {
  @IsNumber()
  @Min(1, { message: "Count mora biti najmanje 1" })
  @IsValidCountForRole({ message: "Broj pakovanja prelazi dozvoljeni limit za vašu ulogu" })
  count!: number;

  @IsNotEmpty({ message: "User role is required (extracted from JWT token)" })
  @IsEnum(UserRole, { message: "User role must be SALES_MANAGER or SALESPERSON" })
  userRole!: UserRole;
}