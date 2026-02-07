export class SalesException extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'SalesException';
  }
}

export class InsufficientPackagingException extends SalesException {
  constructor(message = 'Insufficient packaging available') {
    super(400, message);
    this.name = 'InsufficientPackagingException';
  }
}

export class InvalidSaleDataException extends SalesException {
  constructor(message = 'Invalid sale data', details?: any) {
    super(400, message, details);
    this.name = 'InvalidSaleDataException';
  }
}

export class StorageUnavailableException extends SalesException {
  constructor(message = 'Storage service is unavailable') {
    super(503, message);
    this.name = 'StorageUnavailableException';
  }
}

export class AnalyticsUnavailableException extends SalesException {
  constructor(message = 'Analytics service is unavailable') {
    super(503, message);
    this.name = 'AnalyticsUnavailableException';
  }
}

export class ReceiptNotFoundException extends SalesException {
  constructor(id: number) {
    super(404, `Receipt with id ${id} not found`);
    this.name = 'ReceiptNotFoundException';
  }
}