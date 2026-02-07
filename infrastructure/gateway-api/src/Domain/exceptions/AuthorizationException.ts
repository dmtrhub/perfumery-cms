import { AppException } from './AppException';

export class AuthorizationException extends AppException {
  constructor(message: string = 'Authorization failed') {
    super(message, 'AUTHORIZATION_ERROR', 403);
    Object.setPrototypeOf(this, AuthorizationException.prototype);
  }
}
