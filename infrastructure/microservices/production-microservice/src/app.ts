import express from 'express';
import cors from 'cors';
import "reflect-metadata";
import { initializeDatabase } from './Database/InitializeConnection';
import dotenv from 'dotenv';
import { Repository } from 'typeorm';
import { Plant } from './Domain/models/Plant';
import { ProductionLog } from './Domain/models/ProductionLog';
import { Db } from './Database/DbConnectionPool';
import { IProductionService } from './Domain/services/IProductionService';
import { ProductionService } from './Services/ProductionService';
import { ProductionController } from './WebAPI/controllers/ProductionController';
import { ILogerService } from './Domain/services/ILogerService';
import { LogerService } from './Services/LogerService';

dotenv.config({ quiet: true });

const app = express();

// Read CORS settings from environment
const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:4000";
const corsMethods = process.env.CORS_METHODS?.split(",").map(m => m.trim()) ?? ["GET", "POST", "PUT", "DELETE"];

// Protected microservice from unauthorized access
app.use(cors({
  origin: corsOrigin,
  methods: corsMethods,
}));

app.use(express.json());

initializeDatabase();

// ORM Repositories
const plantRepository: Repository<Plant> = Db.getRepository(Plant);
const productionLogRepository: Repository<ProductionLog> = Db.getRepository(ProductionLog);

// Services
const productionService: IProductionService = new ProductionService(
  plantRepository,
  productionLogRepository
);
const logerService: ILogerService = new LogerService();

// WebAPI routes
const productionController = new ProductionController(productionService, logerService);

// Registering routes
app.use('/api/v1', productionController.getRouter());

export default app;