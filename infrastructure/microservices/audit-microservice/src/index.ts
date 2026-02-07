import 'reflect-metadata';
import dotenv from 'dotenv';
import app, { initializeControllers } from './app';
import { Logger } from './Infrastructure/Logger';
import { initializeDatabase, closeDatabase } from './Database/InitializeConnection';

dotenv.config({ quiet: true });

const PORT = process.env.PORT || 5003;
const logger = Logger.getInstance();

const startServer = async () => {
  try {
    // Initialize database FIRST before using AppDataSource
    await initializeDatabase();
    
    // Initialize controllers AFTER database is ready
    await initializeControllers();
    
    const server = app.listen(PORT, () => {
      logger.info('Application', `🚀 Audit Microservice running on port ${PORT}`);
      console.log(`\x1b[32m✓ Audit Service\x1b[0m http://localhost:${PORT}`);
    });

    // Graceful shutdown
    process.on('SIGTERM', () => {
      logger.info('Application', 'SIGTERM received. Shutting down gracefully...');
      server.close(() => process.exit(0));
    });

    process.on('SIGINT', () => {
      logger.info('Application', 'SIGINT received. Shutting down gracefully...');
      server.close(() => process.exit(0));
    });

    process.on('unhandledRejection', (reason: any) => {
      logger.error('UnhandledRejection', `Unhandled rejection: ${reason?.message || reason}`);
      server.close(() => process.exit(1));
    });

    process.on('uncaughtException', (error: Error) => {
      logger.error('UncaughtException', `Uncaught exception: ${error.message}`);
      server.close(() => process.exit(1));
    });
  } catch (error) {
    logger.error('Application', `Failed to start server: ${error}`);
    await closeDatabase();
    process.exit(1);
  }
};

startServer();
