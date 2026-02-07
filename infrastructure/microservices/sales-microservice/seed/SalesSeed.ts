import { AppDataSource } from "../src/Database/InitializeConnection";
import { CatalogItem } from "../src/Domain/models/CatalogItem";
import { PerfumeType } from "../src/Domain/enums/PerfumeType";
import { SaleType } from "../src/Domain/enums/SaleType";
import { PaymentMethod } from "../src/Domain/enums/PaymentMethod";

async function seedSalesData() {
  try {
    await AppDataSource.initialize();

    const catalogRepository = AppDataSource.getRepository(CatalogItem);

    // Check if data already exists
    const existingItems = await catalogRepository.count();
    if (existingItems > 0) {
      console.log("✅ Catalog items already seeded, skipping...");
      return;
    }

    // Using fixed UUIDs for perfumeIds (must correspond to perfumes created in processing service)
    const perfumeIds = [
      "550e8400-e29b-41d4-a716-446655440020",
      "550e8400-e29b-41d4-a716-446655440021",
      "550e8400-e29b-41d4-a716-446655440022"
    ];

    const seedCatalog = [
      {
        perfumeId: perfumeIds[0],
        name: "Rose Eau de Parfum 250ml",
        type: PerfumeType.PERFUME,
        netQuantityMl: 250,
        available: true,
        price: 4500
      },
      {
        perfumeId: perfumeIds[1],
        name: "Jasmine Cologne 100ml",
        type: PerfumeType.COLOGNE,
        netQuantityMl: 100,
        available: true,
        price: 1800
      },
      {
        perfumeId: perfumeIds[2],
        name: "Lavender Dreams 150ml",
        type: PerfumeType.PERFUME,
        netQuantityMl: 150,
        available: true,
        price: 3200
      }
    ];

    for (const catalogData of seedCatalog) {
      const item = catalogRepository.create(catalogData);
      await catalogRepository.save(item);
      console.log(`✅ Catalog item created: ${catalogData.name}`);
    }

    console.log("✅ Sales data seeded successfully");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

seedSalesData()
  .then(() => {
    console.log("✅ Sales seed completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Sales seed failed:", error);
    process.exit(1);
  });
