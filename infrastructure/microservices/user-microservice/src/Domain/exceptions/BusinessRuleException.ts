import { AppException } from "./AppException";

export class BusinessRuleException extends AppException {
  constructor(message: string) {
    super(message, "BUSINESS_RULE_VIOLATION", 422);
    Object.setPrototypeOf(this, BusinessRuleException.prototype);
  }
}