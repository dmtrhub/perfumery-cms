import { StoragePackaging } from "../models/StoragePackaging";

export interface IStorageStrategy {
  maxPackagesPerShipment: number;
  processingTimePerPackage: number;
  
  shipPackages(packages: StoragePackaging[]): Promise<{
    success: boolean;
    shippedCount: number;
    totalTime: number;
    details: any;
  }>;
}