import express, { Application, Request, Response } from "express";
import dotenv from "dotenv";
import { AppDataSource } from "./Database/InitializeConnection";
import { User } from "./Domain/models/User";
import { ErrorHandler } from "./Middlewares/ErrorHandler";
import { AuthController } from "./WebAPI/controllers/AuthController";
import { AuthService } from "./Services/AuthService";
import { AuditClient } from "./External/AuditClient";

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
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  next();
});

// Services
const userRepository = AppDataSource.getRepository(User);
const auditClient = new AuditClient();
const authService = new AuthService(userRepository, auditClient);
const authController = new AuthController(authService);

app.use("/api/v1/auth", authController.getRouter());

app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "OK", service: "auth-microservice" });
});

app.use(ErrorHandler);

export default app;