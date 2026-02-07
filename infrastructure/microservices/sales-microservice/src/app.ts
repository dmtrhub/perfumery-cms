import express, { Application, Request, Response } from "express";
import dotenv from "dotenv";
import { AppDataSource } from "./Database/InitializeConnection";
import { CatalogItem } from "./Domain/models/CatalogItem";
import { SalesPackaging } from "./Domain/models/SalesPackaging";
import { SalesController } from "./WebAPI/controllers/SalesController";
import { AnalyticsClient } from "./External/AnalyticsClient";
import { AuditClient } from "./External/AuditClient";
import { StorageClient } from "./External/StorageClient";
import { ErrorHandler } from "./Middlewares/ErrorHandler";

dotenv.config();

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
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-User-Id, X-User-Role, X-Username, X-Service");
  next();
});

// Repositories
const catalogItemRepository = AppDataSource.getRepository(CatalogItem);
const salesPackagingRepository = AppDataSource.getRepository(SalesPackaging);

// Clients
const auditClient = new AuditClient();
const analyticsClient = new AnalyticsClient();
const storageClient = new StorageClient();

// Controller
const salesController = new SalesController(
  catalogItemRepository,
  salesPackagingRepository,
  auditClient,
  analyticsClient,
  storageClient
);

app.use("/api/v1/sales", salesController.getRouter());

app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "OK", service: "sales-microservice" });
});

app.use(ErrorHandler);

export default app;