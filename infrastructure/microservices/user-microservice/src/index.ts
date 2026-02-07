import "reflect-metadata";
import { AppDataSource } from "./Database/InitializeConnection";
import app from "./app";
import { DbConnectionPool } from "./Database/DbConnectionPool";

const PORT = process.env.PORT || 5002;

const startServer = async () => {
  try {
    await AppDataSource.initialize();
    DbConnectionPool.setInstance(AppDataSource);

    app.listen(PORT, () => {
      console.log(`User Microservice running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
};

startServer();
