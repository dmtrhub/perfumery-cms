import { Router, Request, Response } from 'express';
import { Repository } from 'typeorm';
import { Logger } from '../../Infrastructure/Logger';
import { decodeJWT } from '../../helpers/decode_jwt';
import { SalesCoordinator } from '../../Services/SalesCoordinator';
import { CatalogItem } from '../../Domain/models/CatalogItem';
import { SalesPackaging } from '../../Domain/models/SalesPackaging';
import { PurchaseDTO, RequestPackagingDTO } from '../../Domain/DTOs/PurchaseDTO';
import { ValidatorMiddleware } from '../../Middlewares/ValidatorMiddleware';
import { AnalyticsClient } from '../../External/AnalyticsClient';
import { AuditClient } from '../../External/AuditClient';
import { StorageClient } from '../../External/StorageClient';
import { CatalogService } from '../../Services/CatalogService';

export class SalesController {
  private router: Router;
  private coordinator: SalesCoordinator;
  private logger: Logger;

  constructor(
    private catalogItemRepository: Repository<CatalogItem>,
    private salesPackagingRepository: Repository<SalesPackaging>,
    private auditClient: AuditClient,
    private analyticsClient: AnalyticsClient,
    private storageClient: StorageClient
  ) {
    this.router = Router();
    this.logger = Logger.getInstance();
    const catalogService = new CatalogService(this.catalogItemRepository, this.auditClient);
    this.coordinator = new SalesCoordinator(
      this.salesPackagingRepository,
      catalogService,
      this.storageClient,
      this.analyticsClient,
      this.auditClient
    );
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    // GET /catalog
    this.router.get('/catalog', (req: Request, res: Response) => this.getCatalog(req, res));

    // GET /packaging
    this.router.get('/packaging', (req: Request, res: Response) => this.getPackaging(req, res));

    // POST /purchase
    this.router.post('/purchase', ValidatorMiddleware(PurchaseDTO), (req: Request, res: Response) => this.purchase(req, res));

    // POST /request-packaging
    this.router.post('/request-packaging', ValidatorMiddleware(RequestPackagingDTO), (req: Request, res: Response) => this.requestPackaging(req, res));
  }

  getRouter(): Router {
    return this.router;
  }

  // GET /catalog
  async getCatalog(req: Request, res: Response): Promise<void> {
    try {
      this.logger.info('SalesController', 'GET /catalog');
      const catalog = await this.coordinator.getCatalog();

      res.status(200).json({
        success: true,
        data: catalog,
        count: catalog.length
      });
    } catch (error) {
      this.logger.error('SalesController', 'Error getting catalog');
      throw error;
    }
  }

  // GET /packaging
  async getPackaging(req: Request, res: Response): Promise<void> {
    try {
      this.logger.info('SalesController', 'GET /packaging');
      const packagings = await this.coordinator.getPackaging();

      res.status(200).json({
        success: true,
        data: packagings,
        count: packagings.length
      });
    } catch (error) {
      this.logger.error('SalesController', 'Error getting packaging');
      throw error;
    }
  }

  // POST /purchase
  async purchase(req: Request, res: Response): Promise<void> {
    try {
      this.logger.info('SalesController', 'POST /purchase');

      const authHeader = req.headers['authorization'] as string;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          message: 'Missing or invalid Authorization header'
        });
        return;
      }

      // Ekstraktuj token i dekodira ga
      const token = authHeader.substring(7);
      const claims = decodeJWT(token);

      if (!claims) {
        res.status(401).json({
          success: false,
          message: 'Invalid or expired token'
        });
        return;
      }

      const dto: PurchaseDTO = req.body;

      // Koristi user info iz tokena
      const receipt = await this.coordinator.purchase(dto, claims.role, claims.id, claims.username, token);

      res.status(201).json({
        success: true,
        message: 'Purchase successful',
        data: receipt
      });
    } catch (error) {
      this.logger.error('SalesController', 'Error processing purchase');
      throw error;
    }
  }

  // POST /request-packaging
  async requestPackaging(req: Request, res: Response): Promise<void> {
    try {
      this.logger.info('SalesController', 'POST /request-packaging');

      const authHeader = req.headers['authorization'] as string;

      if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({
          success: false,
          code: "UNAUTHORIZED",
          message: 'Missing or invalid Authorization header'
        });
        return;
      }

      // Ekstraktuj token i dekodira ga
      const token = authHeader.substring(7);
      const claims = decodeJWT(token);

      if (!claims) {
        res.status(401).json({
          success: false,
          code: "INVALID_TOKEN",
          message: 'Invalid or expired token'
        });
        return;
      }

      const dto: RequestPackagingDTO = req.body;

      // Koristi user role iz tokena
      const packagings = await this.coordinator.requestPackaging(dto.count, claims.role, token);

      res.status(200).json({
        success: true,
        code: "PACKAGINGS_REQUESTED",
        data: packagings,
        count: packagings.length,
        timestamp: new Date().toISOString()
      });
    } catch (error: any) {
      const message = error instanceof Error ? error.message : "Unknown error";
      const statusCode = message.includes("No packagings") ? 422 : 500;

      this.logger.error('SalesController', `Error requesting packaging: ${message}`);

      res.status(statusCode).json({
        success: false,
        code: statusCode === 422 ? "NO_PACKAGINGS_AVAILABLE" : "INTERNAL_SERVER_ERROR",
        message: message || "Failed to request packaging",
        timestamp: new Date().toISOString()
      });
    }
  }
}