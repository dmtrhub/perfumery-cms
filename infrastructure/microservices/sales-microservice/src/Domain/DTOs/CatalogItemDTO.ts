import { PerfumeType } from '../enums/PerfumeType';

export class CatalogItemDTO {
  perfumeId!: string;
  name!: string;
  type!: PerfumeType;
  netQuantityMl!: number;
  quantity!: number;
  available!: boolean;
  price!: number;
}