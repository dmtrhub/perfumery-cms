import { jwtDecode } from 'jwt-decode';

export interface TokenClaims {
  id: string;
  username: string;
  role: string;
  iat?: number;
  exp?: number;
}

export const decodeJWT = (token: string): TokenClaims | null => {
  try {
    const decoded = jwtDecode<TokenClaims>(token);
    
    if (decoded.id && decoded.username && decoded.role) {
      return {
        id: decoded.id,
        username: decoded.username,
        role: decoded.role,
        iat: decoded.iat,
        exp: decoded.exp
      };
    }

    return null;
  } catch (error) {
    return null;
  }
};
