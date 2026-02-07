import axios, { AxiosInstance } from "axios";
import { IStorageClient } from "./IStorageClient";
import { Logger } from "../Infrastructure/Logger";
import { ExternalServiceException } from "../Domain/exceptions/ExternalServiceException";

/**
 * StorageClient
 * Klijent za komunikaciju sa Storage mikroservisom
 */
export class StorageClient implements IStorageClient {
  private readonly logger: Logger;
  private readonly axiosInstance: AxiosInstance;

  constructor() {
    this.logger = Logger.getInstance();
    const storageServiceUrl = process.env.STORAGE_SERVICE_URL || "http://localhost:5006";
    this.axiosInstance = axios.create({
      baseURL: storageServiceUrl,
      timeout: 5000,
      headers: { "X-Service-Name": "PROCESSING_SERVICE" }
    });
  }

  /**
   * Pošalji ambalažu u Storage
   */
  async receivePackaging(packagingId: string): Promise<void> {
    try {
      this.logger.debug("StorageClient", `Sending packaging ${packagingId} to storage`);

      await this.axiosInstance.post("/api/v1/storage/receive", { packagingId });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error("StorageClient", `Failed to send packaging to storage: ${message}`);
      throw new ExternalServiceException(`Storage service error: ${message}`);
    }
  }
}