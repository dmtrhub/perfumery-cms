import { Router, Request, Response } from "express";
import axios from "axios";
import { Logger } from "../Infrastructure/Logger";
import { asyncHandler } from "../Infrastructure/asyncHandler";
import { authenticate } from "../Middlewares/authentification/AuthMiddleware";
import { authorizationMiddleware } from "../Middlewares/authorization/AuthorizationMiddleware";
import { ValidatorMiddleware } from "../Middlewares/ValidatorMiddleware";
import { LoginUserDTO } from "../Domain/DTOs/LoginUserDTO";
import { RegistrationUserDTO } from "../Domain/DTOs/RegistrationUserDTO";

export class GatewayController {
  private readonly router: Router;
  private readonly logger: Logger;

  constructor() {
    this.router = Router();
    this.logger = Logger.getInstance();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // === PUBLIC ENDPOINTS ===
    this.router.get("/health", asyncHandler(this.healthCheck.bind(this)));
    this.router.get("/api/v1/health", asyncHandler(this.servicesHealthCheck.bind(this)));

    // === TEST ENDPOINTS (NO AUTH) ===
    this.router.post(
      "/test/performance/reports/export",
      asyncHandler(this.proxyRequest.bind(this))
    );

    // === AUTH ENDPOINTS ===
    this.router.post(
      "/auth/login",
      ValidatorMiddleware(LoginUserDTO),
      asyncHandler(this.proxyToAuth.bind(this))
    );

    this.router.post(
      "/auth/register",
      ValidatorMiddleware(RegistrationUserDTO),
      asyncHandler(this.proxyToAuth.bind(this))
    );

    this.router.post("/auth/verify", asyncHandler(this.proxyToAuth.bind(this)));

    // === OAuth 2.0 ROUTES (PUBLIC - browser redirects) ===
    this.router.get("/auth/google", asyncHandler(this.redirectToOAuth.bind(this)));
    this.router.get("/auth/github", asyncHandler(this.redirectToOAuth.bind(this)));

    // Auth protected endpoints
    this.router.all(
      /^\/auth\/(?!login$|register$|verify$|google|github|oauth-success).*/,
      authenticate,
      authorizationMiddleware(),
      asyncHandler(this.proxyToAuth.bind(this))
    );

    // === PROTECTED SERVICES ===
    this.router.all(
      /^\/(users|audit|production|processing|storage|sales|analytics|performance)(\/.*)?$/,
      authenticate,
      authorizationMiddleware(),
      asyncHandler(this.proxyRequest.bind(this))
    );

    // === INFO ENDPOINTS ===
    this.router.get("/api/v1", asyncHandler(this.apiInfo.bind(this)));
    this.router.get("/", asyncHandler(this.rootInfo.bind(this)));
  }

  private async healthCheck(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      message: "Gateway service is operational",
      data: {
        service: "gateway",
        version: "1.0.0",
        status: "operational",
      },
    });
  }

  private async servicesHealthCheck(req: Request, res: Response): Promise<void> {
    try {
      const servicesHealth = await this.checkAllServicesHealth();
      const allHealthy = Object.values(servicesHealth).every((status) => status === true);

      res.status(allHealthy ? 200 : 207).json({
        success: allHealthy,
        message: allHealthy ? "All services are healthy" : "Some services are unhealthy",
        data: servicesHealth,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Failed to check services health",
      });
    }
  }

  private async checkAllServicesHealth(): Promise<Record<string, boolean>> {
    const services = [
      { name: "auth", url: process.env.AUTH_SERVICE_API || "http://localhost:5001" },
      { name: "users", url: process.env.USER_SERVICE_API || "http://localhost:5002" },
      { name: "audit", url: process.env.AUDIT_SERVICE_API || "http://localhost:5003" },
      { name: "production", url: process.env.PRODUCTION_SERVICE_API || "http://localhost:5004" },
      { name: "processing", url: process.env.PROCESSING_SERVICE_API || "http://localhost:5005" },
      { name: "storage", url: process.env.STORAGE_SERVICE_API || "http://localhost:5006" },
      { name: "sales", url: process.env.SALES_SERVICE_API || "http://localhost:5007" },
      { name: "analytics", url: process.env.ANALYTICS_SERVICE_API || "http://localhost:5008" },
      { name: "performance", url: process.env.PERFORMANCE_SERVICE_API || "http://localhost:5009" },
    ];

    const healthPromises = services.map(async (service) => {
      try {
        const response = await axios.get(`${service.url}/health`, { timeout: 3000 });
        return { name: service.name, healthy: response.status === 200 };
      } catch {
        return { name: service.name, healthy: false };
      }
    });

    const results = await Promise.all(healthPromises);
    return results.reduce((acc, { name, healthy }) => {
      acc[name] = healthy;
      return acc;
    }, {} as Record<string, boolean>);
  }

  private async rootInfo(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      message: "Perfumery CMS Gateway Service",
      data: {
        service: "gateway",
        version: "1.0.0",
      },
    });
  }

  private async apiInfo(req: Request, res: Response): Promise<void> {
    res.status(200).json({
      success: true,
      message: "Perfumery Gateway API",
      data: {
        service: "gateway",
        version: "1.0.0",
      },
    });
  }

  /**
   * Preusmerava browser direktno na auth servis za OAuth flow
   * Potreban je browser redirect umesto proxy-ja jer OAuth koristi 302 preusmerenja
   */
  private async redirectToOAuth(req: Request, res: Response): Promise<void> {
    const authUrl = process.env.AUTH_SERVICE_API || "http://localhost:5001";
    const oauthPath = req.originalUrl; // /auth/google or /auth/github
    const targetUrl = `${authUrl}/api/v1${oauthPath}`;

    this.logger.info("Gateway", `🔐 OAuth redirect: ${oauthPath} → ${targetUrl}`);
    res.redirect(targetUrl);
  }

  private async proxyToAuth(req: Request, res: Response): Promise<void> {
    const authUrl = process.env.AUTH_SERVICE_API || "http://localhost:5001";

    let fullPath = "";
    if (req.originalUrl.includes("/auth/login")) {
      fullPath = "/api/v1/auth/login";
    } else if (req.originalUrl.includes("/auth/register")) {
      fullPath = "/api/v1/auth/register";
    } else if (req.originalUrl.includes("/auth/verify")) {
      fullPath = "/api/v1/auth/verify";
    } else {
      fullPath = req.originalUrl.replace("/auth/", "/api/v1/auth/");
    }

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (req.headers.authorization) {
        headers["Authorization"] = req.headers.authorization as string;
      }

      const response = await axios({
        method: req.method as any,
        url: `${authUrl}${fullPath}`,
        data: req.body,
        headers: headers,
        timeout: 10000,
        validateStatus: () => true,
      });

      res.status(response.status).json(response.data);
    } catch (error) {
      res.status(500).json({
        success: false,
        message: "Gateway error",
      });
    }
  }



  private async proxyRequest(req: Request, res: Response): Promise<void> {
    // Extract service name from URL - handle both /service/... and /test/service/... patterns
    let originalUrl = req.originalUrl;
    if (originalUrl.startsWith("/test/")) {
      originalUrl = originalUrl.substring(6); // Remove /test/ prefix for routing
    }

    const match = originalUrl.match(/^\/([^\/]+)/);
    const serviceName = match ? match[1] : "";
    const restOfPath = originalUrl.substring(serviceName.length + 1) || "";

    const serviceUrl = this.getServiceUrl(serviceName);

    if (!serviceUrl) {
      res.status(404).json({
        success: false,
        message: `Service '${serviceName}' not found`,
      });
      return;
    }

    try {
      let fullPath = `/api/v1/${serviceName}`;
      if (restOfPath) {
        fullPath += `/${restOfPath}`;
      }

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (req.headers.authorization) {
        headers["Authorization"] = req.headers.authorization as string;
      }

      if (req.user) {
        headers["X-User-Id"] = req.user.id;
        headers["X-User-Role"] = req.user.role;
        headers["X-User-Username"] = req.user.username;
      }

      const response = await axios({
        method: req.method as any,
        url: `${serviceUrl}${fullPath}`,
        data: req.body,
        params: req.query,
        headers: headers,
        timeout: 15000,
        validateStatus: () => true,
        responseType: fullPath.includes("/reports/export") ? "arraybuffer" : "json",
      });

      // Forward response headers
      Object.entries(response.headers).forEach(([key, value]) => {
        if (key.toLowerCase() !== "content-length" && !key.toLowerCase().includes("cookie")) {
          res.setHeader(key, value as string);
        }
      });

      // Send response
      if (fullPath.includes("/reports/export")) {
        const buffer = Buffer.isBuffer(response.data) ? response.data : Buffer.from(response.data);
        res.status(response.status).send(buffer);
      } else {
        res.status(response.status).json(response.data);
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: "Proxy error",
      });
    }
  }

  private getServiceUrl(serviceName: string): string | undefined {
    const serviceMap: { [key: string]: string } = {
      auth: process.env.AUTH_SERVICE_API || "http://localhost:5001",
      users: process.env.USER_SERVICE_API || "http://localhost:5002",
      audit: process.env.AUDIT_SERVICE_API || "http://localhost:5003",
      production: process.env.PRODUCTION_SERVICE_API || "http://localhost:5004",
      processing: process.env.PROCESSING_SERVICE_API || "http://localhost:5005",
      storage: process.env.STORAGE_SERVICE_API || "http://localhost:5006",
      sales: process.env.SALES_SERVICE_API || "http://localhost:5007",
      analytics: process.env.ANALYTICS_SERVICE_API || "http://localhost:5008",
      performance: process.env.PERFORMANCE_SERVICE_API || "http://localhost:5009",
    };
    return serviceMap[serviceName];
  }

  public getRouter(): Router {
    return this.router;
  }
}