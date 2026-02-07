export class AnalyticsException extends Error {
  constructor(
    public statusCode: number,
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'AnalyticsException';
  }
}

export class InvalidReportPeriodException extends AnalyticsException {
  constructor(period: string) {
    super(400, `Invalid report period: ${period}`);
    this.name = 'InvalidReportPeriodException';
  }
}

export class ReportNotFoundException extends AnalyticsException {
  constructor(id: number) {
    super(404, `Report with id ${id} not found`);
    this.name = 'ReportNotFoundException';
  }
}

export class InvalidDateRangeException extends AnalyticsException {
  constructor() {
    super(400, 'Start date must be before end date');
    this.name = 'InvalidDateRangeException';
  }
}

export class NoSalesDataException extends AnalyticsException {
  constructor() {
    super(404, 'No sales data found for the specified period');
    this.name = 'NoSalesDataException';
  }
}