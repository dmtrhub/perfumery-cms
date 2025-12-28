import express from 'express';
import cors from 'cors';
import "reflect-metadata";
import { initializeDatabase } from './Database/InitializeConnection';
import dotenv from 'dotenv';
import { Repository } from 'typeorm';
import { Db } from './Database/DbConnectionPool';
import { Perfume } from './Domain/models/Perfume';
import { ProcessingBatch } from './Domain/models/ProcessingBatch';
import { ProcessingRequest } from './Domain/models/ProcessingRequest';
import { Packaging } from './Domain/models/Packaging';
import { IProcessingService } from './Domain/services/IProcessingService';
import { ProcessingService } from './Services/ProcessingService';
import { ProcessingController } from './WebAPI/controllers/ProcessingController';
import { ILogerService } from './Domain/services/ILogerService';
import { LogerService } from './Services/LogerService';

dotenv.config({ quiet: true });

const app = express();

// CORS settings
const corsOrigin = process.env.CORS_ORIGIN ?? "*";
const corsMethods = process.env.CORS_METHODS?.split(",").map(m => m.trim()) ?? ["GET", "POST", "PUT", "DELETE"];

app.use(cors({
  origin: corsOrigin,
  methods: corsMethods,
}));

app.use(express.json());

initializeDatabase();

// ORM Repositories
const perfumeRepository: Repository<Perfume> = Db.getRepository(Perfume);
const processingBatchRepository: Repository<ProcessingBatch> = Db.getRepository(ProcessingBatch);
const processingRequestRepository: Repository<ProcessingRequest> = Db.getRepository(ProcessingRequest);
const packagingRepository: Repository<Packaging> = Db.getRepository(Packaging);

// Services
const processingService: IProcessingService = new ProcessingService(
  perfumeRepository,
  processingBatchRepository,
  processingRequestRepository,
  packagingRepository
);
const logerService: ILogerService = new LogerService();

// WebAPI routes
const processingController = new ProcessingController(processingService, logerService);

// Registering routes
app.use('/api/v1', processingController.getRouter());

export default app;