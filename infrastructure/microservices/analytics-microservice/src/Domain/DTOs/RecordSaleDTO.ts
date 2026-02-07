import { IsInt, IsNotEmpty, IsPositive, IsEnum, IsArray, ValidateNested, Type } from 'class-validator';

class SaleItemDTO {
  @IsInt()
  @IsPositive()
  perfumeId: number;

  @IsNotEmpty()
  perfumeName: string;

  @IsInt()
  @IsPositive()
  quantity: number;

  @IsPositive()
  unitPrice: number;
}

export class RecordSaleDTO {
  @IsInt()
  @IsPositive()
  receiptId: number;

  @IsEnum(['RETAIL', 'WHOLESALE'])
  saleType: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemDTO)
  items: SaleItemDTO[];

  @IsPositive()
  totalAmount: number;

  @IsNotEmpty()
  createdAt: Date;

  @IsInt()
  @IsPositive()
  userId: number;
}