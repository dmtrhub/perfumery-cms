import { Repository } from "typeorm";
import bcrypt from "bcryptjs";
import { User } from "../Domain/models/User";
import { IAuthService } from "../Domain/services/IAuthService";
import { LoginUserDTO } from "../Domain/DTOs/LoginUserDTO";
import { RegistrationUserDTO } from "../Domain/DTOs/RegistrationUserDTO";
import { AuthResponseType } from "../Domain/types/AuthResponse";
import { AuditClient } from "../External/AuditClient";

export class AuthService implements IAuthService {
  private readonly saltRounds: number = parseInt(process.env.SALT_ROUNDS || "10", 10);
  private auditClient: AuditClient;

  constructor(private userRepository: Repository<User>) {
    this.auditClient = new AuditClient();
    console.log("\x1b[35m[AuthService@1.0.0]\x1b[0m Service started");
  }

  /**
   * Login user - OVERLOAD 1: Bez audit parametara (za kompatibilnost)
   */
  async login(data: LoginUserDTO): Promise<AuthResponseType>;
  
  /**
   * Login user - OVERLOAD 2: Sa audit parametrima
   */
  async login(data: LoginUserDTO, ipAddress?: string, userAgent?: string): Promise<AuthResponseType>;
  
  /**
   * Login user - IMPLEMENTACIJA
   */
  async login(data: LoginUserDTO, ipAddress?: string, userAgent?: string): Promise<AuthResponseType> {
    const auditDetails = {
      username: data.username,
      ipAddress: ipAddress || 'unknown',
      userAgent: userAgent || 'unknown',
      timestamp: new Date().toISOString()
    };

    try {
      console.log(`\x1b[35m[AuthService]\x1b[0m Login attempt for: ${data.username}`);

      // Audit: Login attempt started (ako je audit servis dostupan)
      await this.auditClient.logInfo(
        'AUTH',
        'LOGIN_ATTEMPT',
        `Login attempt for username: ${data.username}`,
        auditDetails
      ).catch(() => {}); // Ignoriši greške ako audit servis nije dostupan

      const user = await this.userRepository.findOne({ where: { username: data.username } });
      
      if (!user) {
        console.warn(`\x1b[33m[AuthService]\x1b[0m User not found: ${data.username}`);
        
        // Audit: User not found
        await this.auditClient.logWarning(
          'AUTH',
          'LOGIN_FAILED',
          `Login failed - user not found: ${data.username}`,
          { ...auditDetails, reason: 'USER_NOT_FOUND' }
        ).catch(() => {});
        
        return { authenificated: false };
      }

      const passwordMatches = await bcrypt.compare(data.password, user.password);
      
      if (!passwordMatches) {
        console.warn(`\x1b[33m[AuthService]\x1b[0m Invalid password for: ${data.username}`);
        
        // Audit: Invalid password
        await this.auditClient.logWarning(
          'AUTH',
          'LOGIN_FAILED',
          `Login failed - invalid password for: ${data.username}`,
          { 
            ...auditDetails, 
            userId: user.id,
            userEmail: user.email,
            reason: 'INVALID_PASSWORD'
          }
        ).catch(() => {});
        
        return { authenificated: false };
      }

      // Audit: Successful login
      await this.auditClient.logInfo(
        'AUTH',
        'LOGIN_SUCCESS',
        `User logged in successfully: ${data.username} (ID: ${user.id})`,
        { 
          ...auditDetails,
          userId: user.id,
          userEmail: user.email,
          userRole: user.role
        }
      ).catch(() => {});

      console.log(`\x1b[32m[AuthService]\x1b[0m Login successful for: ${data.username}`);

      return {
        authenificated: true,
        userData: {
          id: user.id,
          username: user.username,
          role: user.role,
        },
      };

    } catch (error: any) {
      console.error(`\x1b[31m[AuthService]\x1b[0m Login error for ${data.username}:`, error);
      
      // Audit: Login error
      await this.auditClient.logError(
        'AUTH',
        'LOGIN_ERROR',
        error,
        auditDetails
      ).catch(() => {});
      
      return { authenificated: false };
    }
  }

  /**
   * Register new user - OVERLOAD 1: Bez audit parametara
   */
  async register(data: RegistrationUserDTO): Promise<AuthResponseType>;
  
  /**
   * Register new user - OVERLOAD 2: Sa audit parametrima
   */
  async register(data: RegistrationUserDTO, ipAddress?: string, userAgent?: string): Promise<AuthResponseType>;
  
  /**
   * Register new user - IMPLEMENTACIJA
   */
  async register(data: RegistrationUserDTO, ipAddress?: string, userAgent?: string): Promise<AuthResponseType> {
    const auditDetails = {
      username: data.username,
      email: data.email,
      role: data.role,
      ipAddress: ipAddress || 'unknown',
      userAgent: userAgent || 'unknown',
      timestamp: new Date().toISOString()
    };

    try {
      console.log(`\x1b[35m[AuthService]\x1b[0m Registration attempt for: ${data.username}`);

      // Audit: Registration attempt started
      await this.auditClient.logInfo(
        'AUTH',
        'REGISTER_ATTEMPT',
        `Registration attempt for username: ${data.username}`,
        auditDetails
      ).catch(() => {});

      // Check if username or email already exists
      const existingUser = await this.userRepository.findOne({
        where: [{ username: data.username }, { email: data.email }],
      });

      if (existingUser) {
        console.warn(`\x1b[33m[AuthService]\x1b[0m Duplicate registration: ${data.username}/${data.email}`);
        
        // Audit: Duplicate registration
        await this.auditClient.logWarning(
          'AUTH',
          'REGISTER_FAILED',
          `Registration failed - duplicate username/email: ${data.username}`,
          { 
            ...auditDetails, 
            reason: 'DUPLICATE_USER',
            duplicateField: existingUser.username === data.username ? 'username' : 'email'
          }
        ).catch(() => {});
        
        return { authenificated: false };
      }

      const hashedPassword = await bcrypt.hash(data.password, this.saltRounds);

      const newUser = this.userRepository.create({
        username: data.username,
        email: data.email,
        role: data.role,
        password: hashedPassword,
        profileImage: data.profileImage ?? null,
      });

      const savedUser = await this.userRepository.save(newUser);

      // Audit: Successful registration
      await this.auditClient.logInfo(
        'AUTH',
        'REGISTER_SUCCESS',
        `User registered successfully: ${data.username} (ID: ${savedUser.id})`,
        { 
          ...auditDetails,
          userId: savedUser.id
        }
      ).catch(() => {});

      console.log(`\x1b[32m[AuthService]\x1b[0m Registration successful for: ${data.username}`);

      return {
        authenificated: true,
        userData: {
          id: savedUser.id,
          username: savedUser.username,
          role: savedUser.role,
        },
      };

    } catch (error: any) {
      console.error(`\x1b[31m[AuthService]\x1b[0m Registration error for ${data.username}:`, error);
      
      // Audit: Registration error
      await this.auditClient.logError(
        'AUTH',
        'REGISTER_ERROR',
        error,
        auditDetails
      ).catch(() => {});
      
      return { authenificated: false };
    }
  }

  /**
 * Log validation errors (dodajte ovo u klasu)
 */
async logValidationError(
  data: RegistrationUserDTO, 
  validationMessage: string,
  ipAddress?: string, 
  userAgent?: string
): Promise<void> {
  const auditDetails = {
    username: data.username || 'empty',
    email: data.email || 'empty',
    role: data.role || 'empty',
    ipAddress: ipAddress || 'unknown',
    userAgent: userAgent || 'unknown',
    validationError: validationMessage,
    timestamp: new Date().toISOString()
  };

  try {
    console.log(`\x1b[33m[AuthService]\x1b[0m Logging validation error: ${validationMessage}`);
    
    // Audit: Validation failed
    await this.auditClient.logWarning(
      'AUTH',
      'REGISTER_VALIDATION_FAILED',
      `Registration validation failed: ${validationMessage}`,
      auditDetails
    ).catch(() => {});
    
  } catch (error: any) {
    console.error(`\x1b[31m[AuthService]\x1b[0m Failed to log validation error:`, error);
  }
}

/**
 * Takođe dodajte za login validacione greške
 */
async logLoginValidationError(
  data: LoginUserDTO,
  validationMessage: string,
  ipAddress?: string,
  userAgent?: string
): Promise<void> {
  const errorMessage = validationMessage || "Unknown validation error";

  const auditDetails = {
    username: data.username || 'empty',
    ipAddress: ipAddress || 'unknown',
    userAgent: userAgent || 'unknown',
    validationError: validationMessage,
    timestamp: new Date().toISOString()
  };

  try {
    console.log(`\x1b[33m[AuthService]\x1b[0m Logging login validation error: ${validationMessage}`);
    
    await this.auditClient.logWarning(
      'AUTH',
      'LOGIN_VALIDATION_FAILED',
      `Login validation failed: ${validationMessage}`,
      auditDetails
    ).catch(() => {});
    
  } catch (error: any) {
    console.error(`\x1b[31m[AuthService]\x1b[0m Failed to log login validation error:`, error);
  }
}
}