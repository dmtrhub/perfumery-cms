import { Request, Response, NextFunction } from "express";
import { SalesException } from "../Domain/exceptions/SalesException";
import { Logger } from "../Infrastructure/Logger";

export function ErrorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const logger = Logger.getInstance();

  if (err instanceof SalesException) {
    logger.error("ErrorHandler", `${err.name}: ${err.message}`);
    res.status(err.statusCode).json({
      success: false,
      code: err.name,
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