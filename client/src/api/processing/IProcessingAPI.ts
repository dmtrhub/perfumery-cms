import { PerfumeDTO, PackagingDTO, StartProcessingDTO, CreatePackagingDTO, SendPackagingDTO } from "../../models/processing/ProcessingDTO";

export interface IProcessingAPI {
  startProcessing(token: string, data: StartProcessingDTO): Promise<any>;
  getAllPerfumes(token: string, type?: string, status?: string): Promise<PerfumeDTO[]>;
  getPerfumeById(token: string, id: string): Promise<PerfumeDTO>;
  createPackaging(token: string, data: CreatePackagingDTO): Promise<any>;
  sendPackaging(token: string, data: SendPackagingDTO): Promise<any>;
  getPackagingById(token: string, id: string): Promise<PackagingDTO>;
  getPackagings(token: string): Promise<PackagingDTO[]>;
}
