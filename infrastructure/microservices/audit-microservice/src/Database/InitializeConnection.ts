import { Db } from "./DbConnectionPool";

export async function initializeDatabase() {
  try {
    await Db.initialize();
    console.log("\x1b[34m[Production DB]\x1b[0m Database connected");
  } catch (err) {
    console.error("\x1b[31m[Production DB]\x1b[0m Error during DataSource initialization ", err);
  }
}