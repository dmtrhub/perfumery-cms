export interface IStorageClient {
  receivePackaging(packagingId: string): Promise<void>;
}