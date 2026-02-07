import { IStorageStrategy } from "../IStorageStrategy";
import { StoragePackaging } from "../../models/StoragePackaging";
import { PackagingStatus } from "../../enums/PackagingStatus";
import { Logger } from "../../../Infrastructure/Logger";

/**
 * DistributionCenterStrategy
 * Strategija za SALES_MANAGER (3 ambalaže, 0.5s delay)
 */
export class DistributionCenterStrategy implements IStorageStrategy {
  private readonly logger: Logger = Logger.getInstance();
  private readonly MAX_PER_SEND = 3;
  private readonly DELAY_MS = 500; // 0.5 seconds

  async sendPackagings(packagings: StoragePackaging[]): Promise<StoragePackaging[]> {
    this.logger.info(
      "DistributionCenterStrategy",
      `📦 Sending ${this.MAX_PER_SEND} packagings to sales (delay: ${this.DELAY_MS}ms)`
    );

    const toSend = packagings.slice(0, this.MAX_PER_SEND);

    // Primeni delay
    await new Promise(resolve => setTimeout(resolve, this.DELAY_MS));

    // Ažuriraj status
    for (const packaging of toSend) {
      packaging.status = PackagingStatus.SENT_TO_SALES;
      packaging.sentToSalesAt = new Date();
    }

    return toSend;
  }

  getDelay(): number {
    return this.DELAY_MS;
  }

  getMaxPerSend(): number {
    return this.MAX_PER_SEND;
  }
}