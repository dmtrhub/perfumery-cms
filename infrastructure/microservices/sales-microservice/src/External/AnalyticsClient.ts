import axios, { AxiosInstance } from 'axios';
import { Logger } from '../Infrastructure/Logger';
import { IAnalyticsClient } from './IAnalyticsClient';

export class AnalyticsClient implements IAnalyticsClient {
  private readonly logger: Logger;
  private client: AxiosInstance;
  private baseURL: string;

  constructor() {
    this.logger = Logger.getInstance();
    this.baseURL = process.env.ANALYTICS_SERVICE_URL || 'http://localhost:5008';
    this.client = axios.create({
      baseURL: this.baseURL,
      timeout: 10000
    });
  }

  async createReceipt(data: any): Promise<any> {
    try {
      this.logger.info('AnalyticsClient', 'Creating receipt in analytics service');
      this.logger.debug('AnalyticsClient', `Request payload: ${JSON.stringify(data)}`);

      const response = await this.client.post(
        '/api/v1/analytics/receipts',
        data,
        {
          headers: {
            'X-Service': 'SalesService',
            'Content-Type': 'application/json'
          }
        }
      );

      this.logger.info('AnalyticsClient', 'Receipt created successfully');
      return response.data?.data || response.data;
    } catch (error) {
      this.logger.error('AnalyticsClient', `Error creating receipt: ${error instanceof Error ? error.message : 'Unknown error'}`);
      if (error instanceof Error) {
        this.logger.debug('AnalyticsClient', `Error details: ${error.stack}`);
      }
      throw new Error('Failed to create receipt in analytics service');
    }
  }
}
