import { UserDTO } from "../../models/users/UserDTO";

export interface IUserAPI {
  getAllUsers(token: string): Promise<UserDTO[]>;
  getUserById(token: string, id: string): Promise<UserDTO>;
}