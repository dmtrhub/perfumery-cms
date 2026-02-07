import { AppException } from "./AppException";

export class ConflictException extends AppException {
  constructor(message: string) {
    super(message, "CONFLICT", 409);
    Object.setPrototypeOf(this, ConflictException.prototype);
  }
}