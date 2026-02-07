import { AppException } from "./AppException";

export class ValidationException extends AppException {
  constructor(message: string) {
    super(message, "VALIDATION_ERROR", 400);
    Object.setPrototypeOf(this, ValidationException.prototype);
  }
}