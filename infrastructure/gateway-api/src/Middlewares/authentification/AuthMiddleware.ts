import { Request, Response, NextFunction } from "express";
import jwt, { JsonWebTokenError } from "jsonwebtoken";
import { AuthTokenClaimsType } from "../../Domain/types/AuthTokenClaims";
import { AuthenticationException } from "../../Domain/exceptions/AuthenticationException";
import { Logger } from "../../Infrastructure/Logger";

const logger = Logger.getInstance();

declare global {
  namespace Express {
    interface Request {
      user?: AuthTokenClaimsType;
    }
  }
}

export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  try {
    logger.debug("AuthMiddleware", `Request path: ${req.originalUrl}`);
  logger.debug("AuthMiddleware", `Headers: ${JSON.stringify(req.headers)}`);

    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      throw new AuthenticationException("Missing or invalid Authorization header");
    }

    const token = authHeader.split(" ")[1];

    if (!token) {
      throw new AuthenticationException("Token is missing");
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      logger.error("AuthMiddleware", "JWT_SECRET is not configured");
      throw new AuthenticationException("Server misconfiguration");
    }

    const decoded = jwt.verify(token, jwtSecret) as AuthTokenClaimsType;

    // Validate token structure
    if (!decoded.id || !decoded.username || !decoded.role) {
      throw new AuthenticationException("Invalid token structure");
    }

    req.user = decoded;
    logger.debug("AuthMiddleware", `User authenticated: ${decoded.username}`);
    next();
  } catch (err) {
    if (err instanceof AuthenticationException) {
      res.status(401).json(err.toJSON());
      return;
    }

    if (err instanceof JsonWebTokenError) {
      const exception = new AuthenticationException(
        err.name === "TokenExpiredError"
          ? "Token has expired"
          : "Invalid or malformed token"
      );
      res.status(401).json(exception.toJSON());
      return;
    }

    logger.error("AuthMiddleware", "Unexpected error in authentication");
    const exception = new AuthenticationException("Authentication failed");
    res.status(401).json(exception.toJSON());
  }
};
