import { Router, Request, Response } from "express";
import { AuthService } from "../../Services/AuthService";
import { LoginDTO } from "../../Domain/DTOs/LoginDTO";
import { RegisterDTO } from "../../Domain/DTOs/RegisterDTO";
import { Logger } from "../../Infrastructure/Logger";
import { asyncHandler } from "../../Infrastructure/asyncHandler";
import { ValidatorMiddleware } from "../../Middlewares/ValidatorMiddleware";

/**
 * AuthController
 * REST API endpoints za autentifikaciju
 */
export class AuthController {
  private router: Router;
  private readonly logger: Logger;

  constructor(private readonly authService: AuthService) {
    this.router = Router();
    this.logger = Logger.getInstance();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    this.router.post(
      "/register",
      ValidatorMiddleware(RegisterDTO),
      asyncHandler(this.register.bind(this))
    );

    this.router.post(
      "/login",
      ValidatorMiddleware(LoginDTO),
      asyncHandler(this.login.bind(this))
    );

    this.router.post(
      "/verify",
      asyncHandler(this.verify.bind(this))
    );
  }

  /**
   * POST /api/v1/auth/register
   * Registracija novog korisnika
   */
  private async register(req: Request, res: Response): Promise<void> {
    const dto = req.body as RegisterDTO;

    this.logger.debug("AuthController", `Register request for: ${dto.username}`);

    const result = await this.authService.register(dto);

    res.status(201).json({
      success: true,
      code: "USER_REGISTERED",
      message: "User registered successfully",
      statusCode: 201,
      data: { user: result.user },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * POST /api/v1/auth/login
   * Prijava korisnika
   */
  private async login(req: Request, res: Response): Promise<void> {
    const dto = req.body as LoginDTO;

    this.logger.debug("AuthController", `Login request for: ${dto.username}`);

    const result = await this.authService.login(dto);

    res.status(200).json({
      success: true,
      code: "LOGIN_SUCCESS",
      message: "Login successful",
      statusCode: 200,
      data: { token: result.token, user: result.user },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * POST /api/v1/auth/verify
   * Verifikacija tokena
   */
  private async verify(req: Request, res: Response): Promise<void> {
  console.log('🔥🔥🔥 AUTH CONTROLLER VERIFY 🔥🔥🔥');
  console.log('Full headers:', JSON.stringify(req.headers, null, 2));
  console.log('Authorization header:', req.headers.authorization);
  console.log('Body:', req.body);
  
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    console.log('❌ No valid Authorization header');
    res.status(401).json({
      success: false,
      code: "NO_TOKEN_PROVIDED",
      message: "No token provided or invalid format",
      statusCode: 401,
      timestamp: new Date().toISOString(),
    });
    return;
  }

  const token = authHeader.split(' ')[1];
  console.log('🔍 Token extracted (first 50 chars):', token.substring(0, 50) + '...');
  console.log('🔍 Full token length:', token.length);
  
  this.logger.debug("AuthController", "Verify request received");
  
  const result = await this.authService.verify(token);

  console.log('✅ Verify result:', result);
  
  res.status(200).json({
    success: result.valid,
    code: result.valid ? "TOKEN_VALID" : "TOKEN_INVALID",
    message: result.valid ? "Token is valid" : "Token is invalid",
    statusCode: 200,
    data: { valid: result.valid, user: result.user || null },
    timestamp: new Date().toISOString(),
  });
}


  getRouter(): Router {
    return this.router;
  }
}
