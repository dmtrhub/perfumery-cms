import { StoragePackaging } from "../models/StoragePackaging";

export interface IStorageStrategy {
  sendPackagings(packagings: StoragePackaging[]): Promise<StoragePackaging[]>;
  getDelay(): number;
  getMaxPerSend(): number;
}