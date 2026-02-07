import { UserRole } from '../enums/UserRole';

export interface AuthTokenClaimsType {
  id: string;
  userId: string;
  username: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}