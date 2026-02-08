import { CatalogItemDTO, PurchaseDTO, SalesPackagingDTO } from "../../models/sales/SalesDTO";

export interface ISalesAPI {
  getCatalog(token: string): Promise<CatalogItemDTO[]>;
  getPackagings(token: string): Promise<SalesPackagingDTO[]>;
  purchase(token: string, data: PurchaseDTO): Promise<any>;
  requestPackaging(token: string, count: number): Promise<any>;
}
