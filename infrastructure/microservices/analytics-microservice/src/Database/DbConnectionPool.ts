import { DataSource } from "typeorm";
import { Logger } from "../Infrastructure/Logger";

export class DbConnectionPool {
  private static instance: DataSource | null = null;
  private static logger: Logger = Logger.getInstance();

  private constructor() {}

  static getInstance(): DataSource {
    if (!DbConnectionPool.instance) {
      throw new Error("DataSource not initialized. Call setInstance() first.");
    }
    return DbConnectionPool.instance;
  }

  static setInstance(dataSource: DataSource): void {
    DbConnectionPool.instance = dataSource;
    DbConnectionPool.logger.info("DbConnectionPool", "✅ DataSource initialized");
  }

  static async closeConnection(): Promise<void> {
    if (DbConnectionPool.instance && DbConnectionPool.instance.isInitialized) {
      await DbConnectionPool.instance.destroy();
      DbConnectionPool.instance = null;
      DbConnectionPool.logger.info("DbConnectionPool", "✅ Database connection closed");
    }
  }
}