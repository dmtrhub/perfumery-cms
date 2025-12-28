export interface ReceivePackagingDTO {
  processingPackagingId: number;
  perfumeIds: number[];
  destinationWarehouseId: number;
  metadata?: any;
}