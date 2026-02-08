export interface UserDTO {
  id: string;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  profilePicture?: string;
  createdAt?: string;
  updatedAt?: string;
}