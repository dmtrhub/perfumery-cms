import { AppException } from './AppException';

export class AuthenticationException extends AppException {
  constructor(message: string = 'Authentication failed') {
    super(message, 'AUTHENTICATION_ERROR', 401);
    Object.setPrototypeOf(this, AuthenticationException.prototype);
  }
}