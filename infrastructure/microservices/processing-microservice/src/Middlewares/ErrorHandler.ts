import { Request, Response, NextFunction } from "express";
import { AppException } from "../Domain/exceptions/AppException";
import { Logger } from "../Infrastructure/Logger";

export function ErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const logger = Logger.getInstance();

  if (err instanceof AppException) {
    logger.error("ErrorHandler", `${err.code}: ${err.message}`);
    res.status(err.statusCode).json({
      success: false,
      code: err.code,
      message: err.message,
      statusCode: err.statusCode,
      timestamp: new Date().toISOString()
    });
  } else {
    logger.error("ErrorHandler", `Unexpected error: ${err.message}`);
    res.status(500).json({
      success: false,
      code: "INTERNAL_SERVER_ERROR",
      message: "Unexpected error: " + err.message,
      statusCode: 500,
      timestamp: new Date().toISOString()
    });
  }
}