export interface PackagingRequestDTO {
  perfumeType: "PERFUME" | "COLOGNE";
  bottleSize: number; // 150 or 250 ml
  quantity: number; // number of bottles to package
  packagingName: string; // packaging name
  senderAddress: string; // sender address
  warehouseId: number; // ID of warehouse where it will be stored
  priority?: "LOW" | "MEDIUM" | "HIGH"; // default: "MEDIUM"
  requestedBy?: number; // ID of user who requests packaging
  notes?: string;
  shippingDate?: Date; // planned shipping date
}