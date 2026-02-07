import "reflect-metadata";
import app from "./app";
import { AppDataSource } from "./Database/InitializeConnection";
import { DbConnectionPool } from "./Database/DbConnectionPool";
import { Logger } from "./Infrastructure/Logger";

const logger = Logger.getInstance();
const PORT = process.env.PORT || 5005;

async function startServer() {
  try {
    await AppDataSource.initialize();
    DbConnectionPool.setInstance(AppDataSource);

    app.listen(PORT, () => {
      logger.info("Server", `✅ Processing Microservice running on port ${PORT}`);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("Server", `❌ Failed to start server: ${message}`);
    process.exit(1);
  }
}

startServer();