export interface CreatePerfumeDTO {
  name: string;
  type: "PERFUME" | "COLOGNE";
  netQuantityMl: number; // 150ml или 250ml
  serialNumber?: string; // PP-2025-ID_PARFEMA
  plantId: number; // ID plant from which the perfume is made
  expirationDate: Date;
  batchNumber?: string;
  price?: number;
  description?: string;
  createdBy?: number; // User ID who created the perfume entry
}