import "reflect-metadata";
import dotenv from "dotenv";
import app from "./app";
import { AppDataSource } from "./Database/InitializeConnection";
import { DbConnectionPool } from "./Database/DbConnectionPool";
import { Logger } from "./Infrastructure/Logger";

// Učitaj environment varijable
dotenv.config();

const logger = Logger.getInstance();
const PORT = process.env.PORT || 5006;

async function startServer() {
  try {
    await AppDataSource.initialize();
    DbConnectionPool.setInstance(AppDataSource);

    app.listen(PORT, () => {
      logger.info("Server", `✅ Storage Microservice running on port ${PORT}`);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    logger.error("Server", `❌ Failed to start server: ${message}`);
    process.exit(1);
  }
}

startServer();
