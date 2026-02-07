import { AppDataSource } from "../src/Database/InitializeConnection";
import { User } from "../src/Domain/models/User";

/**
 * Seed script for User service
 * User service shares same database (korisnici) as Auth service
 * This script just verifies that users exist (they are created by auth service)
 */
async function seedUserDatabase() {
  try {
    if (!AppDataSource.isInitialized) {
      await AppDataSource.initialize();
    }

    const userRepository = AppDataSource.getRepository(User);

    // Check if users exist (they should be created by auth microservice seed)
    const userCount = await userRepository.count();
    
    if (userCount === 0) {
      console.log("⚠️  No users found! Please run auth-microservice seed first.");
    } else {
      console.log(`✅ Found ${userCount} users in database`);
      console.log("✅ User service database is ready");
    }
  } catch (error) {
    console.error("❌ User seed check failed:", error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

// Run seed
seedUserDatabase()
  .then(() => {
    console.log("✅ User seed verification completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ User seed verification failed:", error);
    process.exit(1);
  });
