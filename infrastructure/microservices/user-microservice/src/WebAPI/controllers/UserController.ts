import { Router, Request, Response } from "express";
import { UserService } from "../../Services/UserService";
import { UpdateUserDTO } from "../../Domain/DTOs/UpdateUserDTO";
import { FilterUsersDTO } from "../../Domain/DTOs/FilterUsersDTO";
import { CreateUserDTO } from "../../Domain/DTOs/CreateUserDTO";
import { Logger } from "../../Infrastructure/Logger";
import { asyncHandler } from "../../Infrastructure/asyncHandler";
import { ValidatorMiddleware } from "../../Middlewares/ValidatorMiddleware";

/**
 * UserController
 * REST API endpoints za upravljanje korisnicima
 */
export class UserController {
  private router: Router;
  private readonly logger: Logger;

  constructor(private readonly userService: UserService) {
    this.router = Router();
    this.logger = Logger.getInstance();
    this.setupRoutes();
  }

  private setupRoutes(): void {
    // GET /api/v1/users - Dohvati sve korisnike
    this.router.get("/", asyncHandler(this.getAllUsers.bind(this)));

    // GET /api/v1/users/:id - Dohvati korisnika po ID-u
    this.router.get("/:id", asyncHandler(this.getUserById.bind(this)));

    // PUT /api/v1/users/:id - Ažuriraj korisnika
    this.router.put(
      "/:id",
      ValidatorMiddleware(UpdateUserDTO),
      asyncHandler(this.updateUser.bind(this))
    );

    // DELETE /api/v1/users/:id - Obriši korisnika
    this.router.delete("/:id", asyncHandler(this.deleteUser.bind(this)));

    // POST /api/v1/users - Kreiraj korisnika
    this.router.post(
      "/",
      ValidatorMiddleware(CreateUserDTO),
      asyncHandler(this.createUser.bind(this))
    );
  }

  /**
   * GET /api/v1/users
   * Dohvati sve korisnike sa opcionalnim filterima
   */
  private async getAllUsers(req: Request, res: Response): Promise<void> {
    this.logger.debug("UserController", "Fetching all users");

    // Prosledi query parametre kao filtere
    const filters: FilterUsersDTO = {
      search: req.query.search as string,
      role: req.query.role as any,
    };

    const users = await this.userService.getAllUsers(filters);

    res.status(200).json({
      success: true,
      code: "USERS_RETRIEVED",
      message: "Users retrieved successfully",
      statusCode: 200,
      data: { users },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * GET /api/v1/users/:id
   * Dohvati korisnika po ID-u
   */
  private async getUserById(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    this.logger.debug("UserController", `Fetching user: ${id}`);

    const user = await this.userService.getUserById(id);

    res.status(200).json({
      success: true,
      code: "USER_RETRIEVED",
      message: "User retrieved successfully",
      statusCode: 200,
      data: { user },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * PUT /api/v1/users/:id
   * Ažuriraj korisnika
   */
  private async updateUser(req: Request, res: Response): Promise<void> {
    const { id } = req.params;
    const dto = req.body as UpdateUserDTO;

    this.logger.debug("UserController", `Updating user: ${id}`);

    const user = await this.userService.updateUser(id, dto);

    res.status(200).json({
      success: true,
      code: "USER_UPDATED",
      message: "User updated successfully",
      statusCode: 200,
      data: { user },
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * DELETE /api/v1/users/:id
   * Obriši korisnika
   */
  private async deleteUser(req: Request, res: Response): Promise<void> {
    const { id } = req.params;

    this.logger.debug("UserController", `Deleting user: ${id}`);

    await this.userService.deleteUser(id);

    res.status(200).json({
      success: true,
      code: "USER_DELETED",
      message: "User deleted successfully",
      statusCode: 200,
      data: {},
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * POST /api/v1/users
   * Kreiraj korisnika
   */
  private async createUser(req: Request, res: Response): Promise<void> {
    const dto = req.body as CreateUserDTO;
    this.logger.debug("UserController", `Creating user: ${dto.username}`);
    const user = await this.userService.createUser(dto);
    res.status(201).json({
      success: true,
      code: "USER_CREATED",
      message: "User created successfully",
      statusCode: 201,
      data: { user },
      timestamp: new Date().toISOString(),
    });
  }

  getRouter(): Router {
    return this.router;
  }
}
