import { Repository } from "typeorm";
import * as bcrypt from "bcryptjs";
import * as jwt from "jsonwebtoken";
import { User } from "../Domain/models/User";
import { LoginDTO } from "../Domain/DTOs/LoginDTO";
import { RegisterDTO } from "../Domain/DTOs/RegisterDTO";
import { Logger } from "../Infrastructure/Logger";
import { IAuditClient } from "../External/IAuditClient";
import { ConflictException } from "../Domain/exceptions/ConflictException";
import { AuthenticationException } from "../Domain/exceptions/AuthenticationException";

/**
 * AuthService
 * Implementacija poslovne logike za autentifikaciju
 */
export class AuthService {
  private readonly logger: Logger;
  private readonly JWT_SECRET = process.env.JWT_SECRET || "your-secret-key";
  private readonly JWT_EXPIRY = "24h";

  constructor(
    private readonly userRepository: Repository<User>,
    private readonly auditClient: IAuditClient
  ) {
    this.logger = Logger.getInstance();
  }

  /**
   * Registracija novog korisnika
   */
  async register(dto: RegisterDTO): Promise<{ user: User }> {
    try {
      this.logger.info("AuthService", `👤 Registering user: ${dto.username}`);

      // 1. Proveri da li korisnik već postoji
      const existingUser = await this.userRepository.findOne({
        where: [{ username: dto.username }, { email: dto.email }],
      });

      if (existingUser) {
        this.logger.warn("AuthService", `User already exists: ${dto.username} or ${dto.email}`);
        throw new ConflictException(
          "Username or email already exists"
        );
      }

      // 2. Heširaj lozinku
      const password = await bcrypt.hash(dto.password, 10);

      // 3. Kreiraj korisnika
      const user = this.userRepository.create({
        username: dto.username,
        password,
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role,
        profilePicture: dto.profilePicture,
      });

      const savedUser = await this.userRepository.save(user);

      this.logger.info("AuthService", `✅ User registered successfully: ${savedUser.username}`);

      await this.auditClient.logInfo(
        "AUTH",
        `User registered: ${savedUser.username} (${savedUser.email})`,
        savedUser.id
      );

      return { user: savedUser };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error("AuthService", `❌ Registration failed: ${message}`);
      await this.auditClient.logError("AUTH", `Registration failed: ${message}`);
      throw error;
    }
  }

  /**
   * Login - prijava korisnika
   */
  async login(dto: LoginDTO): Promise<{ token: string; user: User }> {
    try {
      this.logger.info("AuthService", `🔐 Login attempt for: ${dto.username}`);

      // 1. Pronađi korisnika
      const user = await this.userRepository.findOne({
        where: { username: dto.username },
      });

      if (!user) {
        this.logger.warn("AuthService", `Login failed: User not found - ${dto.username}`);
        throw new AuthenticationException("Invalid username or password");
      }

      // 2. Proveri lozinku
      const isPasswordValid = await bcrypt.compare(dto.password, user.password);

      if (!isPasswordValid) {
        this.logger.warn("AuthService", `Login failed: Invalid password - ${dto.username}`);
        throw new AuthenticationException("Invalid username or password");
      }

      // 3. Generiši JWT
      const token = jwt.sign(
        { id: user.id, username: user.username, role: user.role },
        this.JWT_SECRET,
        { expiresIn: this.JWT_EXPIRY }
      );

      this.logger.info("AuthService", `✅ Login successful: ${user.username}`);

      await this.auditClient.logInfo(
        "AUTH",
        `User logged in: ${user.username}`,
        user.id
      );

      return { token, user };
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error("AuthService", `❌ Login failed: ${message}`);
      await this.auditClient.logWarning("AUTH", `Login failed: ${message}`);
      throw error;
    }
  }

  /**
   * Verify - verifikacija tokena
   */
  async verify(token: string): Promise<{ valid: boolean; user?: User }> {
  try {
    this.logger.debug("AuthService", "🔍 Verifying token...");

    if (!token) {
      await this.auditClient.logWarning("AUTH", `Token verification failed: Token is required`);
      throw new AuthenticationException("Token is required");
    }

    console.log('🔍 Token being verified:', token.substring(0, 50) + '...');
    
    const decoded = jwt.verify(token, this.JWT_SECRET) as any;
    
    console.log('🔍 Decoded token:', decoded);
    console.log('🔍 Decoded keys:', Object.keys(decoded));
    
    // OVDE JE POPRAVKA: Koristi decoded.id umesto decoded.userId
    const userId = decoded.id || decoded.userId;
    
    if (!userId) {
      console.log('❌ Token missing id/userId field');
      return { valid: false };
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      this.logger.warn("AuthService", `Token verification failed: User not found - ${userId}`);
      return { valid: false };
    }

    this.logger.info("AuthService", `✅ Token verified for: ${user.username}`);

    await this.auditClient.logInfo(
      "AUTH",
      `Token verified for: ${user.username}`,
      user.id
    );

    return { valid: true, user };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    this.logger.warn("AuthService", `Token verification failed: ${message}`);
    await this.auditClient.logWarning("AUTH", `Token verification failed: ${message}`);
    return { valid: false };
  }
}
}
