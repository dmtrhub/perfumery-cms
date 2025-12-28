import { StoragePackaging } from "../../Domain/models/StoragePackaging";
import { IStorageStrategy } from "../../Domain/services/IStorageStrategy";

export class WarehouseCenterStrategy implements IStorageStrategy {
  maxPackagesPerShipment = 1;
  processingTimePerPackage = 2500; // 2.5 seconds

  async shipPackages(packages: StoragePackaging[]): Promise<{
    success: boolean;
    shippedCount: number;
    totalTime: number;
    details: any;
  }> {
    console.log(`\x1b[36m[WarehouseCenterStrategy]\x1b[0m Shipping ${packages.length} packages`);
    
    if (packages.length > this.maxPackagesPerShipment) {
      throw new Error(
        `Warehouse center can ship max ${this.maxPackagesPerShipment} packages at once. ` +
        `Requested: ${packages.length}`
      );
    }
    
    const totalTime = packages.length * this.processingTimePerPackage;
    await new Promise(resolve => setTimeout(resolve, totalTime));
    
    return {
      success: true,
      shippedCount: packages.length,
      totalTime,
      details: {
        centerType: 'WAREHOUSE',
        efficiency: 'NORMAL',
        maxPerShipment: this.maxPackagesPerShipment,
        timePerPackage: this.processingTimePerPackage
      }
    };
  }
}