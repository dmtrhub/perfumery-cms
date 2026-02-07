export class AppException extends Error {
  constructor(
    public code: string,
    public statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'AppException';
  }
}
