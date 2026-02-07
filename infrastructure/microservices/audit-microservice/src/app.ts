import express, { Application, Request, Response } from "express";
import dotenv from "dotenv";
import { AuditController } from "./WebAPI/controllers/AuditController";
import { AuditLog } from "./Domain/models/AuditLog";
import { ErrorHandler } from "./Middlewares/ErrorHandler";
import { AppDataSource } from "./Database/InitializeConnection";

dotenv.config();

const app: Application = express();

// ========== MIDDLEWARES ==========
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ========== CORS ==========
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



// ========== CONTROLLERS ==========
let auditController: AuditController;

export async function initializeControllers() {
  if (auditController) return; // Already initialized
  
  const auditRepository = AppDataSource.getRepository(AuditLog);
  auditController = new AuditController(auditRepository);
}

export function getAuditController() {
  if (!auditController) {
    throw new Error('Controllers not initialized. Call initializeControllers() first.');
  }
  return auditController;
}

// ========== ROUTES ==========
app.use("/api/v1/audit", (req: Request, res: Response, next) => {
  try {
    const controller = getAuditController();
    controller.getRouter()(req, res, next);
  } catch (error) {
    next(error);
  }
});

// ========== HEALTH CHECK ==========
app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "OK", service: "audit-microservice" });
});

// ========== ERROR HANDLER ==========
app.use(ErrorHandler);

export default app;