import { DistributionCenterStrategy } from "../Domain/services/strategies/DistributionCenterStrategy";
import { WarehouseCenterStrategy } from "../Domain/services/strategies/WarehouseCenterStrategy";
import { IStorageStrategy } from "../Domain/services/IStorageStrategy";
import { Logger } from "../Infrastructure/Logger";
import { ForbiddenException } from "../Domain/exceptions/ForbiddenException";

/**
 * StorageCoordinator
 * Koordinator za izbor i primenu strategija
 */
export class StorageCoordinator {
  private readonly logger: Logger = Logger.getInstance();
  private readonly distributionCenterStrategy: DistributionCenterStrategy;
  private readonly warehouseCenterStrategy: WarehouseCenterStrategy;

  constructor() {
    this.distributionCenterStrategy = new DistributionCenterStrategy();
    this.warehouseCenterStrategy = new WarehouseCenterStrategy();
  }

  /**
   * Dohvati strategiju na osnovu uloge korisnika
   */
  getStrategy(userRole: string): IStorageStrategy {
    this.logger.debug("StorageCoordinator", `Getting strategy for role: ${userRole}`);

    switch (userRole) {
      case "SALES_MANAGER":
        this.logger.info("StorageCoordinator", `✅ Using DistributionCenterStrategy for SALES_MANAGER`);
        return this.distributionCenterStrategy;

      case "SALESPERSON":
        this.logger.info("StorageCoordinator", `✅ Using WarehouseCenterStrategy for SALESPERSON`);
        return this.warehouseCenterStrategy;

      default:
        throw new ForbiddenException(`User role ${userRole} is not allowed to send packagings`);
    }
  }
}