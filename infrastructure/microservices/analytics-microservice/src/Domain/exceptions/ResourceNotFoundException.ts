import { AppException } from './AppException';

export class ResourceNotFoundException extends AppException {
  constructor(message: string) {
    super('RESOURCE_NOT_FOUND', 404, message);
    this.name = 'ResourceNotFoundException';
  }
}
