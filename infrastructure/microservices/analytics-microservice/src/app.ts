import express, { Application, Request, Response } from "express";
import dotenv from "dotenv";
import { AppDataSource } from "./Database/InitializeConnection";
import { FiscalReceipt } from "./Domain/models/FiscalReceipt";
import { AnalysisReport } from "./Domain/models/AnalysisReport";
import { AnalyticsController } from "./WebAPI/controllers/AnalyticsController";
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

// Repositories
const fiscalReceiptRepository = AppDataSource.getRepository(FiscalReceipt);
const analysisReportRepository = AppDataSource.getRepository(AnalysisReport);

// Clients
const auditClient = new AuditClient();

// Controller
const analyticsController = new AnalyticsController(
  fiscalReceiptRepository,
  analysisReportRepository,
  auditClient
);

app.use("/api/v1/analytics", analyticsController.getRouter());

app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "OK", service: "analytics-microservice" });
});

app.use(ErrorHandler);

export default app;