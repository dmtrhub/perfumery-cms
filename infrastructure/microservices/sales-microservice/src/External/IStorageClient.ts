export interface IStorageClient {
  sendToSales(count: number, userRole: string): Promise<any[]>;
}
