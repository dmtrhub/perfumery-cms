import express, { Application, Request, Response } from "express";
import dotenv from "dotenv";
import "reflect-metadata";
import { AppDataSource } from "./Database/InitializeConnection";
import { PerformanceReport } from "./Domain/models/PerformanceReport";
import { PerformanceController } from "./WebAPI/controllers/PerformanceController";
import { AuditClient } from "./External/AuditClient";
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

// Repository
const reportRepository = AppDataSource.getRepository(PerformanceReport);
// Client
const auditClient = new AuditClient();
// Controller
const performanceController = new PerformanceController(reportRepository, auditClient);

app.use("/api/v1/performance", performanceController.getRouter());

app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "OK", service: "performance-microservice" });
});

app.use(ErrorHandler);

export default app;