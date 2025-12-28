import express from 'express';
import cors from 'cors';
import "reflect-metadata";
import { initializeDatabase } from './Database/InitializeConnection';
import dotenv from 'dotenv';
import { Repository } from 'typeorm';
import { AuditLog } from './Domain/models/AuditLog';
import { Db } from './Database/DbConnectionPool';
import { IAuditService } from './Domain/services/IAuditService';
import { AuditService } from './Services/AuditService';
import { AuditController } from './WebAPI/controllers/AuditController';
import { ILogerService } from './Domain/services/ILogerService';
import { LogerService } from './Services/LogerService';

dotenv.config({ quiet: true });

const app = express();

// Read CORS settings from environment
const corsOrigin = process.env.CORS_ORIGIN ?? "http://localhost:4000";
const corsMethods = process.env.CORS_METHODS?.split(",").map(m => m.trim()) ?? ["GET", "POST", "PUT", "DELETE"];

app.use(cors({
  origin: corsOrigin,
  methods: corsMethods,
}));

app.use(express.json());

initializeDatabase();

// ORM Repository
let auditLogRepository: Repository<AuditLog>;
try {
  auditLogRepository = Db.getRepository(AuditLog);
  console.log("\x1b[34m[Audit Service]\x1b[0m Repository initialized");
} catch (error) {
  console.error("\x1b[31m[Audit Service]\x1b[0m Failed to get repository:", error);
  // Fallback - kreirajte temporary repository
  auditLogRepository = {} as Repository<AuditLog>;
}

// Services
const auditService: IAuditService = new AuditService(auditLogRepository);
const logerService: ILogerService = new LogerService();

// WebAPI routes
const auditController = new AuditController(auditService, logerService);

// Registering routes
app.use('/api/v1', auditController.getRouter());

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Audit Microservice',
    version: '1.0.0',
    status: 'operational',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'audit',
    timestamp: new Date().toISOString(),
    database: Db.isInitialized ? 'connected' : 'disconnected'
  });
});

export default app;