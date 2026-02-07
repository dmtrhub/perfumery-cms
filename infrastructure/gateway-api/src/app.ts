// src/app.ts
import express, { Application, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import { GatewayController } from './WebAPI/GatewayController';
import { ErrorHandler } from './Middlewares/ErrorHandler';
import { Logger } from './Infrastructure/Logger';

export class App {
  private app: Application;
  private readonly logger: Logger;

  constructor() {
    this.app = express();
    this.logger = Logger.getInstance();
    this.configureMiddlewares();
    this.configureRoutes();
    this.configureErrorHandling();
  }

  private configureMiddlewares(): void {
    // Security
    this.app.use(helmet());
    
    // CORS - allow only client app
    const corsOptions = {
      origin: process.env.CLIENT_URL || 'http://localhost:5173',
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
      credentials: true,
      maxAge: 86400
    };
    this.app.use(cors(corsOptions));

    // Performance
    this.app.use(compression());
    
    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));
    
    // Request logging
    this.app.use((req: Request, res: Response, next: NextFunction) => {
      this.logger.debug('Gateway', `${req.method} ${req.originalUrl} from ${req.ip}`);
      next();
    });
  }

  private configureRoutes(): void {
    const gatewayController = new GatewayController();
    
    // Mount root routes
    this.app.use('/', gatewayController.getRouter());
  }

  private configureErrorHandling(): void {
    this.app.use(ErrorHandler);
  }

  start(port: number = 5000): void {
    this.app.listen(port, () => {
      this.logger.info('Gateway', `🚀 Gateway service started on port ${port}`);
      this.logger.info('Gateway', `🌐 CORS configured for: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
      this.logger.info('Gateway', `🔐 JWT verification enabled`);
      this.logger.info('Gateway', `👥 Role-based authorization enabled`);
      
      // Authorization summary
      this.logger.info('Gateway', `📋 Authorization rules:`);
      this.logger.info('Gateway', `   ADMIN → analytics, performance, audit`);
      this.logger.info('Gateway', `   SALES_MANAGER → production, processing, storage, sales, auth, users`);
      this.logger.info('Gateway', `   SALESPERSON → production, processing, storage, sales, auth, users`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      this.logger.info('Gateway', 'SIGTERM received. Shutting down gracefully...');
      process.exit(0);
    });

    process.on('SIGINT', () => {
      this.logger.info('Gateway', 'SIGINT received. Shutting down gracefully...');
      process.exit(0);
    });
  }

  getApp(): Application {
    return this.app;
  }
}