import axios, { AxiosInstance } from 'axios';
import { Logger } from '../Infrastructure/Logger';
import { IStorageClient } from './IStorageClient';

export class StorageClient implements IStorageClient {
  private readonly logger: Logger;
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.logger = Logger.getInstance();
    this.baseURL = process.env.STORAGE_SERVICE_URL || 'http://localhost:5007';
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000
    });
  }

  async sendToSales(count: number, userRole: string, authToken?: string): Promise<any[]> {
    try {
      this.logger.info('StorageClient', `Requesting ${count} packagings from storage`);
      
      const headers: any = {
        'X-Service': 'SalesService',
        'Content-Type': 'application/json',
        'X-User-Role': userRole
      };

      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }

      const response = await this.client.post(
        '/api/v1/storage/send-to-sales',
        { count },
        { headers }
      );

      const data = response.data?.data || [];
      return data;
    } catch (error) {
      this.logger.error('StorageClient', 'Error requesting packagings from storage');
      throw new Error('Failed to request packagings from storage service');
    }
  }
}
