export class Logger {
  private static instance: Logger;

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private formatTimestamp(): string {
    return new Date().toISOString();
  }

  // Instance methods
  info(source: string, message: string): void {
    console.log(`[${this.formatTimestamp()}] [${source}] ℹ️ ${message}`);
  }

  debug(source: string, message: string): void {
    console.log(`[${this.formatTimestamp()}] [${source}] 🐛 ${message}`);
  }

  warn(source: string, message: string): void {
    console.warn(`[${this.formatTimestamp()}] [${source}] ⚠️ ${message}`);
  }

  error(source: string, message: string): void {
    console.error(`[${this.formatTimestamp()}] [${source}] ❌ ${message}`);
  }
}