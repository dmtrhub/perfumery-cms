import express, { Application, Request, Response } from "express";
import dotenv from "dotenv";
import "reflect-metadata";
import { AppDataSource } from "./Database/InitializeConnection";
import { User } from "./Domain/models/User";
import { ErrorHandler } from "./Middlewares/ErrorHandler";
import { UserController } from "./WebAPI/controllers/UserController";
import { UserService } from "./Services/UserService";
import { AuditClient } from "./External/AuditClient";

dotenv.config();

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "http://localhost:5000").split(",").map(o => o.trim());

app.use((req: Request, res: Response, next) => {
  const origin = req.headers.origin as string;
  const isFromGateway = req.headers['x-gateway-forwarded'] === 'true';
  
  if (isFromGateway || allowedOrigins.includes(origin)) {
    res.header("Access-Control-Allow-Origin", origin || "*");
  }
  
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, PATCH, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Gateway-Forwarded, X-User-Id, X-User-Role, X-User-Username");
  next();
});


// Services
const userRepository = AppDataSource.getRepository(User);
const auditClient = new AuditClient();
const userService = new UserService(userRepository, auditClient);
const userController = new UserController(userService);

app.use("/api/v1/users", userController.getRouter());

app.get("/health", (req: Request, res: Response) => {
  res.status(200).json({ status: "OK", service: "user-microservice" });
});

app.use(ErrorHandler);

export default app;
