import axios from "axios";

export interface ReceivePackagingRequest {
  processingPackagingId: number;
  perfumeIds: number[];
  destinationWarehouseId: number;
  metadata?: any;
}

export interface StorageResponse {
  success: boolean;
  message: string;
  data?: {
    storagePackagingId: number;
    warehouseId: number;
    status: string;
  };
}

export class StorageClient {
  private baseUrl: string;

  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || process.env.STORAGE_SERVICE_URL || "http://localhost:5006";
  }

  async receivePackaging(data: ReceivePackagingRequest): Promise<StorageResponse> {
    try {
    const requestData = {
        ...data,
        destinationWarehouseId: Number(data.destinationWarehouseId)
      };
      const response = await axios.post(
        `${this.baseUrl}/api/v1/storage/packaging/receive`,
        requestData,
        {
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
            'X-Service-Origin': 'PROCESSING_SERVICE'
          }
        }
      );

      return response.data as any;
    } catch (error: any) {
      console.error(
        "\x1b[31m[StorageClient]\x1b[0m Failed to send packaging to Storage:",
        error.message
      );
      
      // Fallback - return structured error response
      return {
        success: false,
        message: error.response?.data?.message || error.message || "Storage service unavailable"
      };
    }
  }

  async getPackagingStatus(packagingId: number): Promise<StorageResponse> {
    try {
      const response = await axios.get(
        `${this.baseUrl}/api/v1/storage/packaging/${packagingId}`,
        {
          timeout: 5000
        }
      );

      return response.data as any;
    } catch (error: any) {
      console.error(
        "\x1b[31m[StorageClient]\x1b[0m Failed to get packaging status:",
        error.message
      );
      
      return {
        success: false,
        message: error.message
      };
    }
  }
}