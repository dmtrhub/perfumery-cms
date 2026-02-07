import { AppDataSource } from "../src/Database/InitializeConnection";
import { Warehouse } from "../src/Domain/models/Warehouse";
import { WarehouseType } from "../src/Domain/enums/WarehouseType";

async function seedWarehouses() {
  try {
    await AppDataSource.initialize();

    const warehouseRepository = AppDataSource.getRepository(Warehouse);

    // Check if data already exists
    const existingWarehouses = await warehouseRepository.count();
    if (existingWarehouses > 0) {
      console.log("✅ Warehouses already seeded, skipping...");
      return;
    }

    const seedWarehouses = [
      {
        name: "Main Distribution Center",
        type: WarehouseType.DISTRIBUTION_CENTER,
        location: "Belgrade Industrial Zone",
        maxCapacity: 5000
      },
      {
        name: "Secondary Warehouse Center",
        type: WarehouseType.WAREHOUSE_CENTER,
        location: "Nis Regional",
        maxCapacity: 3000
      },
      {
        name: "Cold Storage Facility",
        type: WarehouseType.WAREHOUSE_CENTER,
        location: "Zemun Port Area",
        maxCapacity: 2000
      },
      {
        name: "Export Center",
        type: WarehouseType.DISTRIBUTION_CENTER,
        location: "Customs Zone",
        maxCapacity: 4000
      }
    ];

    for (const warehouseData of seedWarehouses) {
      const warehouse = warehouseRepository.create(warehouseData);
      await warehouseRepository.save(warehouse);
      console.log(`✅ Warehouse created: ${warehouseData.name}`);
    }

    console.log("✅ Storage warehouses seeded successfully");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

seedWarehouses()
  .then(() => {
    console.log("✅ Storage seed completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Storage seed failed:", error);
    process.exit(1);
  });
