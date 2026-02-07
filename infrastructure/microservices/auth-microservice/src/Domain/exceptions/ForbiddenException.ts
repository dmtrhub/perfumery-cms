import { AppException } from "./AppException";

export class ForbiddenException extends AppException {
  constructor(message: string) {
    super(message, "FORBIDDEN", 403);
    Object.setPrototypeOf(this, ForbiddenException.prototype);
  }
}