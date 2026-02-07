export class AppException extends Error {
  constructor(
    public message: string,
    public code: string,
    public statusCode: number = 500
  ) {
    super(message);
    this.name = "AppException";
    Object.setPrototypeOf(this, AppException.prototype);
  }
}