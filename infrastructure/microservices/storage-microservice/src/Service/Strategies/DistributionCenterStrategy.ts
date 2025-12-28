import { StoragePackaging } from "../../Domain/models/StoragePackaging";
import { IStorageStrategy } from "../../Domain/services/IStorageStrategy";

export class DistributionCenterStrategy implements IStorageStrategy {
  maxPackagesPerShipment = 3;
  processingTimePerPackage = 500; // 0.5 seconds

  async shipPackages(packages: StoragePackaging[]): Promise<{
    success: boolean;
    shippedCount: number;
    totalTime: number;
    details: any;
  }> {
    console.log(`\x1b[36m[DistributionCenterStrategy]\x1b[0m Shipping ${packages.length} packages`);
    
    if (packages.length > this.maxPackagesPerShipment) {
      throw new Error(
        `Distribution center can ship max ${this.maxPackagesPerShipment} packages at once. ` +
        `Requested: ${packages.length}`
      );
    }
    
    // Simulate processing time
    const totalTime = packages.length * this.processingTimePerPackage;
    await new Promise(resolve => setTimeout(resolve, totalTime));
    
    return {
      success: true,
      shippedCount: packages.length,
      totalTime,
      details: {
        centerType: 'DISTRIBUTION',
        efficiency: 'HIGH',
        maxPerShipment: this.maxPackagesPerShipment,
        timePerPackage: this.processingTimePerPackage
      }
    };
  }
}