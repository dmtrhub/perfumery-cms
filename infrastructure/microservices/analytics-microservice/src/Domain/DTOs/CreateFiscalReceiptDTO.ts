import { IsEnum, IsArray, IsNumber, ValidateNested, IsOptional, IsString, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';
import { SaleType } from '../enums/SaleType';
import { PaymentMethod } from '../enums/PaymentMethod';

class SaleItemDTO {
  @IsOptional()
  perfumeId?: string;

  @IsNumber()
  quantity!: number;

  @IsNumber()
  price!: number;
}

export class CreateFiscalReceiptDTO {
  @IsEnum(SaleType)
  saleType!: SaleType;

  @IsEnum(PaymentMethod)
  paymentMethod!: PaymentMethod;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemDTO)
  items!: SaleItemDTO[];

  @IsNumber()
  totalAmount!: number;

  @IsString()
  userId!: string;

  @IsString()
  username!: string;
}
