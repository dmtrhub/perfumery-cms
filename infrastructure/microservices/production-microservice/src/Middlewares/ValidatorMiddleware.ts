import { Request, Response, NextFunction } from "express";
import { validate } from "class-validator";
import { plainToClass } from "class-transformer";
import { Logger } from "../Infrastructure/Logger";

export function ValidatorMiddleware(dtoClass: any) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const logger = Logger.getInstance();
    const object = plainToClass(dtoClass, req.body);
    const errors = await validate(object);

    if (errors.length > 0) {
      logger.warn("ValidatorMiddleware", `Validation failed for ${dtoClass.name}`);
      
      // Ekstraktuj samo poruke iz constraints-a
      const messages: string[] = [];
      errors.forEach(error => {
        if (error.constraints) {
          Object.values(error.constraints).forEach(constraint => {
            if (typeof constraint === 'string') {
              messages.push(constraint);
            }
          });
        }
      });

      const mainMessage = messages.length > 0 ? messages[0] : "Input validation failed";

      res.status(400).json({
        success: false,
        code: "VALIDATION_ERROR",
        message: mainMessage,
        statusCode: 400,
        timestamp: new Date().toISOString(),
        details: messages.length > 1 ? messages : undefined
      });
      return;
    }

    next();
  };
}