export interface ShipPackagingDTO {
  warehouseId: number; // ID of warehouse to which it is shipped
  shippingMethod?: "DISTRIBUTION_CENTER" | "WAREHOUSE_CENTER"; // default depends on role
  shippingDate?: Date; // default: now
  trackingNumber?: string;
  carrier?: string;
  estimatedDelivery?: Date;
  notes?: string;
  shippedBy?: number; // ID of user who ships
}