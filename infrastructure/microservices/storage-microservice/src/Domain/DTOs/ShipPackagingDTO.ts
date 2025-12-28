export interface ShipPackagingDTO {
  packagingIds: number[];
  destination: "SALES_SERVICE";
  userId: number;
  userRole: string; // "MANAGER" or "SELLER"
}