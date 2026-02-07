import { Repository } from "typeorm";
import { User } from "../Domain/models/User";
import { UpdateUserDTO } from "../Domain/DTOs/UpdateUserDTO";
import { FilterUsersDTO } from "../Domain/DTOs/FilterUsersDTO";
import { Logger } from "../Infrastructure/Logger";
import { IAuditClient } from "../External/IAuditClient";
import { ResourceNotFoundException } from "../Domain/exceptions/ResourceNotFoundException";
import { CreateUserDTO } from "../Domain/DTOs/CreateUserDTO";

/**
 * UserService
 * Implementacija poslovne logike za upravljanje korisnicima
 */
export class UserService {
  private readonly logger: Logger;

  constructor(
    private readonly userRepository: Repository<User>,
    private readonly auditClient: IAuditClient
  ) {
    this.logger = Logger.getInstance();
  }

  /**
   * Dohvati sve korisnike sa filtiranjem
   */
  async getAllUsers(filters?: FilterUsersDTO): Promise<User[]> {
    try {
      this.logger.info("UserService", "📋 Fetching all users");

      let query = this.userRepository.createQueryBuilder("user");

      // Primeni filtere ako postoje
      if (filters?.search) {
        query = query.where(
          "user.username LIKE :search OR user.email LIKE :search OR user.firstName LIKE :search OR user.lastName LIKE :search",
          { search: `%${filters.search}%` }
        );
      }

      if (filters?.role) {
        query = query.andWhere("user.role = :role", { role: filters.role });
      }

      query = query.orderBy("user.createdAt", "DESC");

      const users = await query.getMany();

      this.logger.info("UserService", `✅ Retrieved ${users.length} users`);
      await this.auditClient.logInfo("USER", `Fetched ${users.length} users`);

      return users;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error("UserService", `❌ Failed to fetch users: ${message}`);
      await this.auditClient.logError("USER", `Failed to fetch users: ${message}`);
      throw error;
    }
  }

  /**
   * Dohvati korisnika po ID-u
   */
  async getUserById(id: string): Promise<User> {
    try {
      this.logger.debug("UserService", `🔍 Fetching user: ${id}`);

      const user = await this.userRepository.findOne({ where: { id } });

      if (!user) {
        this.logger.warn("UserService", `User not found: ${id}`);
        throw new ResourceNotFoundException(`User with ID ${id} not found`);
      }

      this.logger.info("UserService", `✅ Retrieved user: ${user.username}`);
      await this.auditClient.logInfo("USER", `Fetched user: ${user.username}`);

      return user;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error("UserService", `❌ Failed to fetch user: ${message}`);
      await this.auditClient.logError("USER", `Failed to fetch user ${id}: ${message}`);
      throw error;
    }
  }

  /**
   * Kreiraj novog korisnika
   */
  async createUser(dto: CreateUserDTO): Promise<User> {
    try {
      this.logger.info("UserService", `🆕 Creating user: ${dto.username}`);

      // Proveri da li email već postoji
      const existingEmail = await this.userRepository.findOne({ where: { email: dto.email } });
      if (existingEmail) {
        this.logger.warn("UserService", `Email already in use: ${dto.email}`);
        throw new Error("Email already in use");
      }

      // Proveri da li username već postoji
      const existingUsername = await this.userRepository.findOne({ where: { username: dto.username } });
      if (existingUsername) {
        this.logger.warn("UserService", `Username already in use: ${dto.username}`);
        throw new Error("Username already in use");
      }

      // Kreiraj korisnika
      const user = this.userRepository.create({
        username: dto.username,
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        role: dto.role,
        profilePicture: dto.profilePicture,
      });

      const savedUser = await this.userRepository.save(user);

      this.logger.info("UserService", `✅ User created: ${savedUser.username}`);
      await this.auditClient.logInfo(
        "USER",
        `User created: ${savedUser.username}`,
        savedUser.id
      );
      return savedUser;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error("UserService", `❌ Failed to create user: ${message}`);
      await this.auditClient.logError("USER", `Failed to create user: ${message}`);
      throw error;
    }
  }

  /**
   * Ažuriraj korisnika
   */
  async updateUser(id: string, dto: UpdateUserDTO): Promise<User> {
    try {
      this.logger.info("UserService", `✏️ Updating user: ${id}`);

      // Pronađi korisnika
      const user = await this.userRepository.findOne({ where: { id } });

      if (!user) {
        this.logger.warn("UserService", `User not found: ${id}`);
        throw new ResourceNotFoundException(`User with ID ${id} not found`);
      }

      // Ažuriraj polja ako su prosleđena
      if (dto.firstName) {
        user.firstName = dto.firstName;
      }

      if (dto.lastName) {
        user.lastName = dto.lastName;
      }

      if (dto.email) {
        // Proveri da li email već postoji
        const existingUser = await this.userRepository.findOne({
          where: { email: dto.email },
        });

if (existingUser) {
          this.logger.warn("UserService", `Email already in use: ${dto.email}`);
          throw new Error("Email already in use");
        }

        user.email = dto.email;
      }

      if (dto.profilePicture !== undefined) {
        user.profilePicture = dto.profilePicture;
      }

      // Sačuvaj promene
      const updatedUser = await this.userRepository.save(user);

      this.logger.info("UserService", `✅ User updated: ${updatedUser.username}`);

      await this.auditClient.logInfo(
        "USER",
        `User updated: ${updatedUser.username}`,
        updatedUser.id
      );

      return updatedUser;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error("UserService", `❌ Failed to update user: ${message}`);
      await this.auditClient.logError("USER", `Failed to update user ${id}: ${message}`);
      throw error;
    }
  }

  /**
   * Obriši korisnika
   */
  async deleteUser(id: string): Promise<void> {
    try {
      this.logger.info("UserService", `🗑️ Deleting user: ${id}`);

      // Pronađi korisnika
      const user = await this.userRepository.findOne({ where: { id } });

      if (!user) {
        this.logger.warn("UserService", `User not found: ${id}`);
        throw new ResourceNotFoundException(`User with ID ${id} not found`);
      }

      // Obriši korisnika
      await this.userRepository.remove(user);

      this.logger.info("UserService", `✅ User deleted: ${user.username}`);

      await this.auditClient.logInfo(
        "USER",
        `User deleted: ${user.username}`,
        user.id
      );
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error("UserService", `❌ Failed to delete user: ${message}`);
      await this.auditClient.logError("USER", `Failed to delete user ${id}: ${message}`);
      throw error;
    }
  }
}
