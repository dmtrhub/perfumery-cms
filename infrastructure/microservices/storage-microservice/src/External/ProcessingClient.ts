import axios, { AxiosInstance } from "axios";
import { IProcessingClient, PackagingDTO } from "./IProcessingClient";
import { Logger } from "../Infrastructure/Logger";

/**
 * ProcessingClient
 * Klijent za komunikaciju sa Processing mikroservisom
 */
export class ProcessingClient implements IProcessingClient {
  private readonly logger: Logger;
  private readonly axiosInstance: AxiosInstance;

  constructor() {
    this.logger = Logger.getInstance();
    const processingServiceUrl = process.env.PROCESSING_SERVICE_URL || "http://localhost:5005";
    this.axiosInstance = axios.create({
      baseURL: processingServiceUrl,
      timeout: 5000,
      headers: { "X-Service-Name": "STORAGE_SERVICE" }
    });
  }

  async getPackagingById(packagingId: string): Promise<PackagingDTO> {
    try {
      this.logger.debug("ProcessingClient", `Fetching packaging details: ${packagingId}`);

      const response = await this.axiosInstance.get(`/api/v1/processing/packaging/${packagingId}`);

      const data = response.data.data;
      
      return data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error("ProcessingClient", `Failed to fetch packaging: ${message}`);
      throw error;
    }
  }
}