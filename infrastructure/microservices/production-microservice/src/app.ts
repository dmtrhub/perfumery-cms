import express, { Application, Request, Response } from "express";
import dotenv from "dotenv";
import { AppDataSource } from "./Database/InitializeConnection";
import { Plant } from "./Domain/models/Plant";
import { ProductionController } from "./WebAPI/controllers/ProductionController";
import { AuditClient } from "./External/AuditClient";
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

const plantRepository = AppDataSource.getRepository(Plant);
const auditClient = new AuditClient();
const productionController = new ProductionController(plantRepository, auditClient);

app.use("/api/v1/production", productionController.getRouter());

app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "OK", service: "production-microservice" });
});

app.use(ErrorHandler);

export default app;