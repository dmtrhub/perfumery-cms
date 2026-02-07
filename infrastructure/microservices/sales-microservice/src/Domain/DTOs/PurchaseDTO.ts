import { IsUUID, IsArray, IsString, IsNotEmpty, IsEnum, IsPositive, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { SaleType } from '../enums/SaleType';
import { PaymentMethod } from '../enums/PaymentMethod';

export class PurchaseItemDTO {
  @IsUUID()
  perfumeId!: string;

  @IsPositive()
  quantity!: number;
}

export class PurchaseDTO {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseItemDTO)
  items!: PurchaseItemDTO[];

  @IsEnum(SaleType)
  saleType!: SaleType;

  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;
}

export class RequestPackagingDTO {
  @IsPositive()
  count!: number;
}
