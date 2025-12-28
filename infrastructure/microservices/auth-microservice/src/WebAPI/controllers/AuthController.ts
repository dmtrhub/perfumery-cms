import { Request, Response, Router } from 'express';
import jwt from "jsonwebtoken";
import { IAuthService } from '../../Domain/services/IAuthService';
import { LoginUserDTO } from '../../Domain/DTOs/LoginUserDTO';
import { RegistrationUserDTO } from '../../Domain/DTOs/RegistrationUserDTO';
import { validateLoginData } from '../validators/LoginValidator';
import { validateRegistrationData } from '../validators/RegisterValidator';
import { ILogerService } from '../../Domain/services/ILogerService';

export class AuthController {
  private router: Router;
  private authService: IAuthService;
  private readonly logerService: ILogerService;

  constructor(authService: IAuthService, logerService: ILogerService) {
    this.router = Router();
    this.authService = authService;
    this.logerService = logerService;
    this.initializeRoutes();
  }

  private initializeRoutes(): void {
    this.router.post('/auth/login', this.login.bind(this));
    this.router.post('/auth/register', this.register.bind(this));
  }

  /**
 * POST /api/v1/auth/login
 */
private async login(req: Request, res: Response): Promise<void> {
  try {
    this.logerService.log("Login request received");

    const data: LoginUserDTO = req.body as LoginUserDTO;

    // Get IP and User-Agent
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');

    // Validate login input
    const validation = validateLoginData(data);
    if (!validation.success) {
      console.log(`\x1b[33m[AuthController]\x1b[0m Login validation failed:`, validation.message);
      
      //  AUDIT ZA LOGIN VALIDACIONE GREŠKE (samo kada validacija ne uspe)
      try {
        await (this.authService as any).logLoginValidationError(
          data, 
          validation.message, 
          ipAddress, 
          userAgent
        ).catch(() => {});
      } catch (auditError) {
        console.error(`\x1b[31m[AuthController]\x1b[0m Failed to log login validation error:`, auditError);
      }
      
      res.status(400).json({ success: false, message: validation.message });
      return; //  PRAVILNO - vraćamo se ovde
    }

    //  Sada pozovite servis sa audit contextom (samo kada validacija prođe)
    const result = await (this.authService as any).login(data, ipAddress, userAgent);

    if (result.authenificated && result.userData) {
      const token = jwt.sign(
        { 
          id: result.userData.id, 
          username: result.userData.username, 
          role: result.userData.role 
        },
        process.env.JWT_SECRET ?? "",
        { expiresIn: '6h' }
      );

      res.status(200).json({ 
        success: true, 
        token,
        user: result.userData
      });
    } else {
      res.status(401).json({ 
        success: false, 
        message: "Invalid credentials!" 
      });
    }
  } catch (error) {
    this.logerService.log(error as string)
    res.status(500).json({ 
      success: false, 
      message: "Server error" 
    });
  }
}

  /**
   * POST /api/v1/auth/register
   */
  private async register(req: Request, res: Response): Promise<void> {
  try {
    await this.logerService.log("Registration request received");

    const data: RegistrationUserDTO = req.body as RegistrationUserDTO;
    
    // Get IP and User-Agent for audit (ČAK I PRE VALIDACIJE)
    const ipAddress = req.ip;
    const userAgent = req.get('User-Agent');
    
    const auditContext = {
      ipAddress,
      userAgent,
      username: data.username || 'empty',
      email: data.email || 'empty',
      timestamp: new Date().toISOString()
    };

    // Validate registration input
    const validation = validateRegistrationData(data);
    if (!validation.success) {
      console.log(`\x1b[33m[AuthController]\x1b[0m Validation failed:`, validation.message);
      
      //  DODAJTE AUDIT ZA VALIDACIONE GREŠKE
      try {
        // Koristite type assertion da pozovete overload
        await (this.authService as any).logValidationError(
          data, 
          validation.message, 
          ipAddress, 
          userAgent
        ).catch(() => {}); // Ignoriši greške ako audit ne radi
      } catch (auditError) {
        console.error(`\x1b[31m[AuthController]\x1b[0m Failed to log validation error:`, auditError);
      }
      
      res.status(400).json({ 
        success: false, 
        message: validation.message 
      });
      return;
    }

    //  Sada pozovite servis sa audit contextom
    const result = await (this.authService as any).register(data, ipAddress, userAgent);

    if (result.authenificated && result.userData) {
      const token = jwt.sign(
        { 
          id: result.userData.id, 
          username: result.userData.username, 
          role: result.userData.role 
        },
        process.env.JWT_SECRET ?? "",
        { expiresIn: '6h' }
      );

      res.status(201).json({ 
        success: true, 
        message: "Registration successful", 
        token,
        user: result.userData
      });
    } else {
      res.status(400).json({ 
        success: false, 
        message: "Registration failed. Username or email may already exist." 
      });
    }
  } catch (error: any) {
    await this.logerService.log(`Error during registration: ${error}`);
    res.status(500).json({ 
      success: false, 
      message: "Internal server error" 
    });
  }
}

  public getRouter(): Router {
    return this.router;
  }
}