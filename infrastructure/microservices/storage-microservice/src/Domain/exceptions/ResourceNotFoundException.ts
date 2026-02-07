import { AppException } from "./AppException";

export class ResourceNotFoundException extends AppException {
  constructor(message: string) {
    super(message, "RESOURCE_NOT_FOUND", 404);
    Object.setPrototypeOf(this, ResourceNotFoundException.prototype);
  }
}