import { Request, Response, NextFunction } from "express";
import { AppException } from "../Domain/exceptions/AppException";
import { Logger } from "../Infrastructure/Logger";

export function ErrorHandler(
  err: any,  // Promenite u any
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const logger = Logger.getInstance();

  console.error('=== ERROR HANDLER CALLED ===');
  console.error('Error type:', typeof err);
  console.error('Error:', err);
  console.error('Error name:', err?.name);
  console.error('Error message:', err?.message);
  console.error('res type:', typeof res);
  console.error('res.status type:', typeof res?.status);
  
  // Ako res nije validan, ne možemo ništa uraditi
  if (!res || typeof res.status !== 'function') {
    console.error('FATAL: Invalid response object');
    if (typeof next === 'function') {
      next(err);
    }
    return;
  }

  // Ako error nema message, logujte ga
  if (!err?.message) {
    logger.error("ErrorHandler", `Error without message: ${JSON.stringify(err)}`);
  } else {
    logger.error("ErrorHandler", `Error: ${err.message}`);
    logger.error("ErrorHandler", `Stack: ${err.stack}`);
  }

  if (err instanceof AppException) {
    res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
      statusCode: err.statusCode,
      timestamp: new Date().toISOString()
    });
    return;
  }

  // Handle specific JWT errors
  if (err.name === "JsonWebTokenError") {
    res.status(401).json({
      success: false,
      code: "INVALID_TOKEN",
      message: "Invalid token",
      statusCode: 401,
      timestamp: new Date().toISOString()
    });
    return;
  }

  if (err.name === "TokenExpiredError") {
    res.status(401).json({
      success: false,
      code: "TOKEN_EXPIRED",
      message: "Token has expired",
      statusCode: 401,
      timestamp: new Date().toISOString()
    });
    return;
  }

  // Default error
  res.status(500).json({
    success: false,
    code: "INTERNAL_SERVER_ERROR",
    message: process.env.NODE_ENV === "production" 
      ? "Internal server error" 
      : err?.message || "Unknown error",
    statusCode: 500,
    timestamp: new Date().toISOString()
  });
}
