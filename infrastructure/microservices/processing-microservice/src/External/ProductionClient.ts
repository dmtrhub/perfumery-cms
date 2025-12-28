import axios from "axios";

export class ProductionClient {
  private baseUrl: string;

  constructor(
    baseUrl: string = process.env.PRODUCTION_SERVICE_URL || "http://localhost:3003"
  ) {
    this.baseUrl = baseUrl;
  }

  /**
   * GET /api/v1/plants/for-processing
   * Get plants ready for processing
   */
  async getPlantsForProcessing(): Promise<{
    success: boolean;
    data: Array<{
      id: number;
      plantType: string;
      oilIntensity: number;
      quantity: number;
      readyForHarvest: boolean;
    }>
  }> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/v1/plants/for-processing`,
        { timeout: 3000 }
      );
      return response.data as any;
    } catch (error: any) {
      console.error(
        "\x1b[31m[ProductionClient]\x1b[0m Failed to get plants for processing:",
        error.message
      );
      return {
        success: false,
        data: []
      };
    }
  }

  /**
   * POST /api/v1/plants/request-for-processing
   * Request new plant for processing balance
   */
  async requestNewPlantForProcessing(
    processedPlantId: number,
    processedIntensity: number
  ): Promise<{
    success: boolean;
    message: string;
    data?: {
      id: number;
      plantType: string;
      oilIntensity: number;
    }
  }> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/v1/plants/request-for-processing`,
        { processedPlantId, processedIntensity },
        { timeout: 5000 }
      );
      return response.data as any;
    } catch (error: any) {
      console.error(
        "\x1b[31m[ProductionClient]\x1b[0m Failed to request new plant:",
        error.message
      );
      return {
        success: false,
        message: "Failed to request new plant from production service"
      };
    }
  }

  /**
   * POST /api/v1/plants/:id/harvest
   * Harvest plants for processing
   */
  async harvestPlantsForProcessing(
    plantId: number,
    quantity: number,
    userId: string
  ): Promise<{
    success: boolean;
    message: string;
  }> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/api/v1/plants/${plantId}/harvest`,
        { quantity, forProcessing: true, userId },
        { timeout: 5000 }
      );
      return response.data as any;
    } catch (error: any) {
      console.error(
        `\x1b[31m[ProductionClient]\x1b[0m Failed to harvest plants ${plantId}:`,
        error.message
      );
      return {
        success: false,
        message: `Failed to harvest plants: ${error.message}`
      };
    }
  }

  /**
   * GET /api/v1/plants/:id
   * Get plant by ID
   */
  async getPlantById(plantId: number): Promise<{
    success: boolean;
    data?: {
      id: number;
      plantType: string;
      oilIntensity: number;
      quantity: number;
      readyForHarvest: boolean;
    }
  }> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/v1/plants/${plantId}`,
        { timeout: 3000 }
      );
      return response.data as any;
    } catch (error: any) {
      console.error(
        `\x1b[31m[ProductionClient]\x1b[0m Failed to get plant ${plantId}:`,
        error.message
      );
      return {
        success: false
      };
    }
  }

  /**
   * PUT /api/v1/plants/:id/oil-intensity
   * Change oil intensity for a plant
   */
  async changeOilIntensity(
    plantId: number,
    percentage: number,
    userId: string
  ): Promise<{
    success: boolean;
    message: string;
    data?: {
      id: number;
      oilIntensity: number;
      thresholdExceeded: boolean;
    }
  }> {
    try {
      const response = await axios.put(
        `${this.baseUrl}/api/v1/plants/${plantId}/oil-intensity`,
        { percentage, userId },
        { timeout: 5000 }
      );
      return response.data as any;
    } catch (error: any) {
      console.error(
        `\x1b[31m[ProductionClient]\x1b[0m Failed to change oil intensity for plant ${plantId}:`,
        error.message
      );
      return {
        success: false,
        message: `Failed to change oil intensity: ${error.message}`
      };
    }
  }

  /**
   * GET /api/v1/plants/available
   * Get available plants for harvest
   */
  async getAvailablePlants(): Promise<{
    success: boolean;
    data: Array<{
      id: number;
      plantType: string;
      oilIntensity: number;
      quantity: number;
      readyForHarvest: boolean;
    }>
  }> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/v1/plants/available`,
        { timeout: 3000 }
      );
      return response.data as any;
    } catch (error: any) {
      console.error(
        "\x1b[31m[ProductionClient]\x1b[0m Failed to get available plants:",
        error.message
      );
      return {
        success: false,
        data: []
      };
    }
  }

  /**
   * Health check
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await axios.get(`${this.baseUrl}/health`, { timeout: 2000 });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }
}