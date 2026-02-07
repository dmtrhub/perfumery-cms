// src/Middlewares/authorization/AuthorizationMiddleware.ts
import { Request, Response, NextFunction } from "express";
import { AuthorizationException } from "../../Domain/exceptions/AuthorizationException";
import { Logger } from "../../Infrastructure/Logger";

const logger = Logger.getInstance();

// ТАЧНА мапа по спецификацији
export const authorize = (serviceName: string, userRole: string): boolean => {
  const rolePermissions = {
    'ADMIN': ['analytics', 'performance', 'audit'],
    'SALES_MANAGER': ['production', 'processing', 'storage', 'sales', 'auth', 'users'],
    'SALESPERSON': ['production', 'processing', 'storage', 'sales', 'auth', 'users']
  };

  const allowedServices = rolePermissions[userRole as keyof typeof rolePermissions];
  
  if (!allowedServices) {
    return false;
  }

  return allowedServices.includes(serviceName);
};

export const authorizationMiddleware = () => {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      // Извуци service name из путање
      const pathParts = req.originalUrl.split('/').filter(Boolean);
      const serviceName = pathParts[0] || "";
      
      const user = req.user;

      if (!user) {
        throw new AuthorizationException("User not authenticated");
      }

      // Ауторизација се не примењује на auth руте (login/register/verify)
      // Ове су већ обрађене као public руте
      const isPublicAuthRoute = 
        req.originalUrl.includes('/auth/login') || 
        req.originalUrl.includes('/auth/register') || 
        req.originalUrl.includes('/auth/verify');
      
      if (isPublicAuthRoute) {
        return next();
      }

      // Провери да ли је ово важећи сервис
      const validServices = [
        'auth', 'users', 'audit', 'production', 'processing', 
        'storage', 'sales', 'analytics', 'performance'
      ];
      
      if (!validServices.includes(serviceName)) {
        throw new AuthorizationException(`Invalid service: ${serviceName}`);
      }

      if (!authorize(serviceName, user.role)) {
        logger.warn("Authorization", `Unauthorized: ${user.username} (${user.role}) → ${serviceName}`);
        throw new AuthorizationException(
          `User role '${user.role}' is not authorized to access ${serviceName} service`
        );
      }

      logger.debug("Authorization", `Authorized: ${user.username} (${user.role}) → ${serviceName}`);
      next();
    } catch (err) {
      if (err instanceof AuthorizationException) {
        res.status(403).json(err.toJSON());
        return;
      }
      throw err;
    }
  };
};