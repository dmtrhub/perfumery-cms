import { DataSource } from 'typeorm';
import dotenv from 'dotenv';
import { AuditLog } from '../Domain/models/AuditLog';
import { DbConnectionPool } from './DbConnectionPool';
import { Logger } from '../Infrastructure/Logger';

dotenv.config();

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306', 10),
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '1234',
  database: process.env.DB_NAME || 'audit_logovi',
  synchronize: process.env.NODE_ENV === 'development',
  logging: process.env.NODE_ENV === 'development',
  logger: 'advanced-console',
  entities: [AuditLog],
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: true } : false,
  extra: {
    connectionLimit: 10
  }
});

export const initializeDatabase = async (): Promise<void> => {
  const logger = Logger.getInstance();

  try {
    if (AppDataSource.isInitialized) {
      logger.warn('Database', 'Database already initialized');
      return;
    }

    logger.info('Database', 'Initializing database connection...');

    await AppDataSource.initialize();
    DbConnectionPool.setInstance(AppDataSource);

    logger.info('Database', `✅ Audit Database initialized successfully (${process.env.DB_NAME})`);
  } catch (error: any) {
    logger.error('Database', `❌ Database initialization failed: ${error.message}`);
    throw error;
  }
};

export const closeDatabase = async (): Promise<void> => {
  try {
    await DbConnectionPool.closeConnection();
  } catch (error) {
    const logger = Logger.getInstance();
    logger.error('Database', 'Failed to close database');
    throw error;
  }
};