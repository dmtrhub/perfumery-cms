import { IStorageStrategy } from "../IStorageStrategy";
import { StoragePackaging } from "../../models/StoragePackaging";
import { PackagingStatus } from "../../enums/PackagingStatus";
import { Logger } from "../../../Infrastructure/Logger";

/**
 * WarehouseCenterStrategy
 * Strategija za SALESPERSON (1 ambalaža, 2.5s delay)
 */
export class WarehouseCenterStrategy implements IStorageStrategy {
  private readonly logger: Logger = Logger.getInstance();
  private readonly MAX_PER_SEND = 1;
  private readonly DELAY_MS = 2500; // 2.5 seconds

  async sendPackagings(packagings: StoragePackaging[]): Promise<StoragePackaging[]> {
    this.logger.info(
      "WarehouseCenterStrategy",
      `📦 Sending ${this.MAX_PER_SEND} packaging to sales (delay: ${this.DELAY_MS}ms)`
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