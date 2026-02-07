import express, { Application, Request, Response } from "express";
import dotenv from "dotenv";
import { AppDataSource } from "./Database/InitializeConnection";
import { Perfume } from "./Domain/models/Perfume";
import { Packaging } from "./Domain/models/Packaging";
import { ProcessingController } from "./WebAPI/controllers/ProcessingController";
import { AuditClient } from "./External/AuditClient";
import { ProductionClient } from "./External/ProductionClient";
import { StorageClient } from "./External/StorageClient";
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
const perfumeRepository = AppDataSource.getRepository(Perfume);
const packagingRepository = AppDataSource.getRepository(Packaging);

// Clients
const auditClient = new AuditClient();
const productionClient = new ProductionClient();
const storageClient = new StorageClient();

// Controller
const processingController = new ProcessingController(
  perfumeRepository,
  packagingRepository,
  auditClient,
  productionClient,
  storageClient
);

app.use("/api/v1/processing", processingController.getRouter());

app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "OK", service: "processing-microservice" });
});

app.use(ErrorHandler);

export default app;