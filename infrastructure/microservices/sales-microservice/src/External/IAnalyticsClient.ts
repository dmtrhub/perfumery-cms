export interface IAnalyticsClient {
  createReceipt(data: any): Promise<any>;
}
