import { UserRole } from "../enums/UserRole";

export class UserDTO {
  id!: string;
  username!: string;
  email!: string;
  firstName!: string;
  lastName!: string;
  profilePicture?: string;
  role!: UserRole;
  createdAt!: Date;
  updatedAt!: Date;
}
