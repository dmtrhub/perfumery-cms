import { AppDataSource } from "../src/Database/InitializeConnection";
import { Perfume } from "../src/Domain/models/Perfume";
import { PerfumeType } from "../src/Domain/enums/PerfumeType";
import { PerfumeStatus } from "../src/Domain/enums/PerfumeStatus";

async function seedPerfumes() {
  try {
    await AppDataSource.initialize();

    const perfumeRepository = AppDataSource.getRepository(Perfume);

    // Check if data already exists
    const existingPerfumes = await perfumeRepository.count();
    if (existingPerfumes > 0) {
      console.log("✅ Perfumes already seeded, skipping...");
      return;
    }

    // Using fixed UUIDs for plantIds (must correspond to plants created in production service)
    const rosaPlantId = "550e8400-e29b-41d4-a716-446655440010";
    const jasminePlantId = "550e8400-e29b-41d4-a716-446655440011";
    const lavenderPlantId = "550e8400-e29b-41d4-a716-446655440012";

    const seedPerfumes = [
      {
        name: "Rose Eau de Parfum",
        type: PerfumeType.PERFUME,
        netQuantityMl: 250,
        serialNumber: "EDP-ROSE-250-001",
        plantId: rosaPlantId,
        expirationDate: new Date("2027-12-31"),
        status: PerfumeStatus.CREATED
      },
      {
        name: "Jasmine Cologne",
        type: PerfumeType.COLOGNE,
        netQuantityMl: 100,
        serialNumber: "COLOGNE-JASMINE-100-001",
        plantId: jasminePlantId,
        expirationDate: new Date("2027-06-30"),
        status: PerfumeStatus.PACKED
      },
      {
        name: "Lavender Dreams",
        type: PerfumeType.PERFUME,
        netQuantityMl: 150,
        serialNumber: "EDP-LAVENDER-150-001",
        plantId: lavenderPlantId,
        expirationDate: new Date("2028-03-31"),
        status: PerfumeStatus.CREATED
      }
    ];

    for (const perfumeData of seedPerfumes) {
      const perfume = perfumeRepository.create(perfumeData);
      await perfumeRepository.save(perfume);
      console.log(`✅ Perfume created: ${perfumeData.name}`);
    }

    console.log("✅ Processing perfumes seeded successfully");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

seedPerfumes()
  .then(() => {
    console.log("✅ Processing seed completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Processing seed failed:", error);
    process.exit(1);
  });
