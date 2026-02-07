import * as bcrypt from "bcryptjs";
import { AppDataSource } from "../src/Database/InitializeConnection";
import { User } from "../src/Domain/models/User";
import { UserRole } from "../src/Domain/enums/UserRole";

async function seedAuthUsers() {
  try {
    await AppDataSource.initialize();

    const userRepository = AppDataSource.getRepository(User);

    // Check if data already exists
    const existingUsers = await userRepository.count();
    if (existingUsers > 0) {
      console.log("✅ Users already seeded, skipping...");
      return;
    }

    const seedUsers = [
      {
        username: "admin",
        email: "admin@perfumery.local",
        password: await bcrypt.hash("admin123", 10),
        role: UserRole.ADMIN,
        firstName: "Admin",
        lastName: "User"
      },
      {
        username: "sales_manager",
        email: "manager@perfumery.local",
        password: await bcrypt.hash("password123", 10),
        role: UserRole.SALES_MANAGER,
        firstName: "Marko",
        lastName: "Marković"
      },
      {
        username: "salesperson",
        email: "sales@perfumery.local",
        password: await bcrypt.hash("password123", 10),
        role: UserRole.SALESPERSON,
        firstName: "Aleksandar",
        lastName: "Aleksić"
      },
      {
        username: "test_user",
        email: "test@perfumery.local",
        password: await bcrypt.hash("test123", 10),
        role: UserRole.SALESPERSON,
        firstName: "Test",
        lastName: "User"
      }
    ];

    for (const userData of seedUsers) {
      const user = userRepository.create(userData);
      await userRepository.save(user);
      console.log(`✅ User created: ${userData.username}`);
    }

    console.log("✅ Auth users seeded successfully");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

seedAuthUsers()
  .then(() => {
    console.log("✅ Auth seed completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Auth seed failed:", error);
    process.exit(1);
  });
