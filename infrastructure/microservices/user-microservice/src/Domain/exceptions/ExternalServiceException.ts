import { AppException } from "./AppException";

export class ExternalServiceException extends AppException {
  constructor(message: string) {
    super(message, "EXTERNAL_SERVICE_ERROR", 503);
    Object.setPrototypeOf(this, ExternalServiceException.prototype);
  }
}