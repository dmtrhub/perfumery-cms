import { Router, Request, Response } from "express";
import { AuthService } from "../../Services/AuthService";
import { OAuthService } from "../../Services/OAuthService";
import { LoginDTO } from "../../Domain/DTOs/LoginDTO";
import { RegisterDTO } from "../../Domain/DTOs/RegisterDTO";
import { Logger } from "../../Infrastructure/Logger";
import { asyncHandler } from "../../Infrastructure/asyncHandler";
import { ValidatorMiddleware } from "../../Middlewares/ValidatorMiddleware";

/**
 * AuthController
 * REST API endpoints za autentifikaciju i OAuth 2.0
 */
export class AuthController {
  private router: Router;
  private readonly logger: Logger;

  constructor(
    private readonly authService: AuthService,
    private readonly oauthService: OAuthService
  ) {
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

    // === OAuth 2.0 Routes ===

    // Google OAuth
    this.router.get(
      "/google",
      asyncHandler(this.googleAuth.bind(this))
    );

    this.router.get(
      "/google/callback",
      asyncHandler(this.googleCallback.bind(this))
    );

    // GitHub OAuth
    this.router.get(
      "/github",
      asyncHandler(this.githubAuth.bind(this))
    );

    this.router.get(
      "/github/callback",
      asyncHandler(this.githubCallback.bind(this))
    );

    // OAuth success page
    this.router.get(
      "/oauth-success",
      asyncHandler(this.oauthSuccess.bind(this))
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

  // ==================== OAuth 2.0 ====================

  /**
   * GET /api/v1/auth/google
   * Preusmeravanje na Google OAuth stranicu za prijavu
   */
  private async googleAuth(req: Request, res: Response): Promise<void> {
    this.logger.debug("AuthController", "Google OAuth initiation");
    const url = this.oauthService.getGoogleAuthUrl();
    res.redirect(url);
  }

  /**
   * GET /api/v1/auth/google/callback
   * Google OAuth callback - razmena koda za token
   */
  private async googleCallback(req: Request, res: Response): Promise<void> {
    const { code, error } = req.query;

    if (error || !code) {
      this.logger.error("AuthController", `Google OAuth error: ${error || "No code received"}`);
      res.redirect(`/api/v1/auth/oauth-success?error=${encodeURIComponent(String(error || "No authorization code received"))}`);
      return;
    }

    try {
      const profile = await this.oauthService.handleGoogleCallback(code as string);
      const result = await this.authService.findOrCreateOAuthUser(profile);
      res.redirect(`/api/v1/auth/oauth-success?token=${result.token}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      this.logger.error("AuthController", `Google OAuth callback failed: ${message}`);
      res.redirect(`/api/v1/auth/oauth-success?error=${encodeURIComponent(message)}`);
    }
  }

  /**
   * GET /api/v1/auth/github
   * Preusmeravanje na GitHub OAuth stranicu za prijavu
   */
  private async githubAuth(req: Request, res: Response): Promise<void> {
    this.logger.debug("AuthController", "GitHub OAuth initiation");
    const url = this.oauthService.getGitHubAuthUrl();
    res.redirect(url);
  }

  /**
   * GET /api/v1/auth/github/callback
   * GitHub OAuth callback - razmena koda za token
   */
  private async githubCallback(req: Request, res: Response): Promise<void> {
    const { code, error } = req.query;

    if (error || !code) {
      this.logger.error("AuthController", `GitHub OAuth error: ${error || "No code received"}`);
      res.redirect(`/api/v1/auth/oauth-success?error=${encodeURIComponent(String(error || "No authorization code received"))}`);
      return;
    }

    try {
      const profile = await this.oauthService.handleGitHubCallback(code as string);
      const result = await this.authService.findOrCreateOAuthUser(profile);
      res.redirect(`/api/v1/auth/oauth-success?token=${result.token}`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Authentication failed";
      this.logger.error("AuthController", `GitHub OAuth callback failed: ${message}`);
      res.redirect(`/api/v1/auth/oauth-success?error=${encodeURIComponent(message)}`);
    }
  }

  /**
   * GET /api/v1/auth/oauth-success
   * Prikazuje stranicu sa rezultatom OAuth autentifikacije
   * Electron BrowserWindow prati ovu stranicu za ekstrakciju tokena
   */
  private async oauthSuccess(req: Request, res: Response): Promise<void> {
    const { error } = req.query;

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>oauth-success</title>
        <style>
          body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            background-color: #202020;
            color: #ffffff;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
          }
          .container {
            text-align: center;
            padding: 40px;
            background: rgba(45, 45, 45, 0.7);
            border-radius: 8px;
            border: 1px solid rgba(255, 255, 255, 0.08);
          }
          .success { color: #60cdff; }
          .error { color: #c42b1c; }
          p { color: #a6a6a6; margin-top: 12px; }
        </style>
      </head>
      <body>
        <div class="container">
          ${
            error
              ? `<h2 class="error">Authentication Failed</h2><p>${error}</p>`
              : `<h2 class="success">Authentication Successful</h2><p>This window will close automatically...</p>`
          }
        </div>
        <script>
          // Token je dostupan u URL-u za Electron ekstrakciju
          // Ovaj prozor će Electron automatski zatvoriti
        </script>
      </body>
      </html>
    `;

    res.setHeader("Content-Type", "text/html");
    res.send(html);
  }


  getRouter(): Router {
    return this.router;
  }
}
