export interface GetPerfumesDTO {
  type?: "PERFUME" | "COLOGNE";
  minQuantity?: number; // minimal quantity in inventory
  bottleSize?: number; // 150 or 250 ml
  plantId?: number; // filter by plant ID
  batchNumber?: string;
  expiredOnly?: boolean; // only expired perfumes
  availableOnly?: boolean; // only available (not reserved)
  search?: string; // search by name or description
  page?: number;
  limit?: number;
  sortBy?: "name" | "type" | "quantity" | "expirationDate";
  sortOrder?: "ASC" | "DESC";
}