import express, { Application, Request, Response } from "express";
import dotenv from "dotenv";
import { AppDataSource } from "./Database/InitializeConnection";
import { Warehouse } from "./Domain/models/Warehouse";
import { StoragePackaging } from "./Domain/models/StoragePackaging";
import { StorageController } from "./WebAPI/controllers/StorageController";
import { AuditClient } from "./External/AuditClient";
import { ProcessingClient } from "./External/ProcessingClient";
import { ErrorHandler } from "./Middlewares/ErrorHandler";
import { Logger } from "./Infrastructure/Logger";

dotenv.config();

const logger = Logger.getInstance();
const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:5000").split(",").map(o => o.trim());

app.use((req: Request, res: Response, next) => {
  const origin = req.headers.origin as string;
  if (allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin);
  }
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

// Repositories
const warehouseRepository = AppDataSource.getRepository(Warehouse);
const packagingRepository = AppDataSource.getRepository(StoragePackaging);

// Clients
const auditClient = new AuditClient();
const processingClient = new ProcessingClient();

// Controller
const storageController = new StorageController(
  warehouseRepository,
  packagingRepository,
  auditClient,
  processingClient
);

app.use("/api/v1/storage", storageController.getRouter());

app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "OK", service: "storage-microservice" });
});

app.use(ErrorHandler);

export default app;
