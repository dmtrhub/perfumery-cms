import 'reflect-metadata';
import dotenv from 'dotenv';
import { App } from './app'; // Увези класу
import { Logger } from './Infrastructure/Logger';

// Load environment variables
dotenv.config();

const logger = Logger.getInstance();

// Validate required environment variables
const requiredEnvVars = [
  'JWT_SECRET',
  'AUTH_SERVICE_API',
  'USER_SERVICE_API',
  'AUDIT_SERVICE_API',
  'PRODUCTION_SERVICE_API',
  'PROCESSING_SERVICE_API',
  'STORAGE_SERVICE_API',
  'SALES_SERVICE_API',
  'ANALYTICS_SERVICE_API',
  'PERFORMANCE_SERVICE_API',
];

const missingEnvVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingEnvVars.length > 0) {
  logger.error('Gateway', '❌ Missing required environment variables:');
  missingEnvVars.forEach(varName => {
    logger.error('Gateway', `   - ${varName}`);
  });
  logger.error('Gateway', '\nPlease check your .env file');
  process.exit(1);
}

const PORT = parseInt(process.env.PORT || '5000', 10);

try {
  const app = new App(); // Инстанцирај класу
  app.start(PORT);
} catch (error) {
  logger.error('Gateway', `❌ Failed to start Gateway service: ${error}`);
  process.exit(1);
}