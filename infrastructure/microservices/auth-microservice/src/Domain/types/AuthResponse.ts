import { UserRole } from "../enums/UserRole";

export type AuthResponseType = {
  authenificated: boolean;
  token?: string;
  userData?: UserDataResponse;
};

export type UserDataResponse = {
  id: number;
  username: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  profileImage?: string | null;
};

export interface TokenPayload {
  id: number;
  username: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
}

export interface AuthResponse<T = any> {
  success: boolean;
  code: string;
  message: string;
  statusCode: number;
  data?: T;
  timestamp: string;
  error?: Record<string, any>;
}

export interface PaginatedAuthResponse<T = any> extends AuthResponse<T> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}
