import axios, { AxiosInstance } from "axios";
import { IProductionClient } from "./IProductionClient";
import { PlantDTO } from "../Domain/DTOs/PlantDTO";
import { Logger } from "../Infrastructure/Logger";
import { ExternalServiceException } from "../Domain/exceptions/ExternalServiceException";

/**
 * ProductionClient
 * Klijent za komunikaciju sa Production mikroservisom
 */
export class ProductionClient implements IProductionClient {
  private readonly logger: Logger;
  private readonly axiosInstance: AxiosInstance;

  constructor() {
    this.logger = Logger.getInstance();
    const productionServiceUrl = process.env.PRODUCTION_SERVICE_URL || "http://localhost:5004";
    this.axiosInstance = axios.create({
      baseURL: productionServiceUrl,
      timeout: 10000,
      headers: { "X-Service-Name": "PROCESSING_SERVICE" }
    });
  }

  /**
   * Uberi biljke iz Production servisa
   */
  async harvestPlants(commonName: string, count: number): Promise<PlantDTO[]> {
    try {
      this.logger.debug("ProductionClient", `Harvesting ${count} plants of ${commonName}`);

      const response = await this.axiosInstance.post("/api/v1/production/plants/harvest", {
        commonName,
        count
      });

      return response.data.data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error("ProductionClient", `Failed to harvest plants: ${message}`);
      throw new ExternalServiceException(`Production service error: ${message}`);
    }
  }

  /**
   * Kreiraj novu biljku
   */
  async createPlant(commonName: string, latinName: string, originCountry: string): Promise<PlantDTO> {
    try {
      this.logger.debug("ProductionClient", `Creating plant: ${commonName}`);

      const response = await this.axiosInstance.post("/api/v1/production/plants", {
        commonName,
        latinName,
        originCountry
      });

      return response.data.data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error("ProductionClient", `Failed to create plant: ${message}`);
      throw new ExternalServiceException(`Production service error: ${message}`);
    }
  }

  /**
   * Promeni jačinu ulja
   */
  async adjustOilStrength(plantId: string, percentage: number): Promise<PlantDTO> {
    try {
      this.logger.debug("ProductionClient", `Adjusting oil strength for plant ${plantId}`);

      const response = await this.axiosInstance.patch(
        `/api/v1/production/plants/${plantId}/oil-strength`,
        { percentage }
      );

      return response.data.data;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error("ProductionClient", `Failed to adjust oil strength: ${message}`);
      throw new ExternalServiceException(`Production service error: ${message}`);
    }
  }

  /**
   * Označi biljke kao obrađene
   */
  async markAsProcessed(plantIds: string[]): Promise<void> {
    try {
      this.logger.debug("ProductionClient", `Marking ${plantIds.length} plants as processed`);

      await this.axiosInstance.patch("/api/v1/production/plants/mark-processed", {
        plantIds
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error("ProductionClient", `Failed to mark plants as processed: ${message}`);
      throw new ExternalServiceException(`Production service error: ${message}`);
    }
  }
}