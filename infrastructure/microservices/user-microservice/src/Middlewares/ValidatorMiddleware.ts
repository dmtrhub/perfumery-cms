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
      
      const formattedErrors = errors.map(error => ({
        property: error.property,
        constraints: error.constraints
      }));

      res.status(400).json({
        success: false,
        code: "VALIDATION_ERROR",
        message: "Input validation failed",
        statusCode: 400,
        timestamp: new Date().toISOString(),
        error: { errors: formattedErrors }
      });
      return;
    }

    next();
  };
}