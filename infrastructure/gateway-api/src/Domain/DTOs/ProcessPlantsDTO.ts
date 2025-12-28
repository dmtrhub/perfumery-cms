export interface ProcessPlantsDTO {
  perfumeType: "PERFUME" | "COLOGNE";
  bottleCount: number; // number of bottles to produce
  bottleSize: number; // 150 or 250 ml
  plantIds?: number[]; // optional - specific plants for processing
  requestSource?: "CLIENT" | "PACKAGING" | "MANUAL"; // default: "MANUAL"
  priority?: "LOW" | "MEDIUM" | "HIGH"; // default: "MEDIUM"
  requestedBy?: number; // User ID who requests processing
  notes?: string;
}