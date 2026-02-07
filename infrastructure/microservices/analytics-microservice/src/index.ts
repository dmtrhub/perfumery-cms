import "reflect-metadata";
import { AppDataSource } from "./Database/InitializeConnection";
import { DbConnectionPool } from "./Database/DbConnectionPool";
import app from "./app";

const PORT = process.env.PORT || 5008;

const startServer = async () => {
  try {
    await AppDataSource.initialize();
    DbConnectionPool.setInstance(AppDataSource);

    app.listen(PORT, () => {
      console.log(`Analytics Microservice running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();