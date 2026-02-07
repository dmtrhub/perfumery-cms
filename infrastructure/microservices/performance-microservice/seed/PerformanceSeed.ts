import { AppDataSource } from "../src/Database/InitializeConnection";
import { PerformanceReport } from "../src/Domain/models/PerformanceReport";

async function seedPerformanceData() {
  try {
    await AppDataSource.initialize();

    const reportRepository = AppDataSource.getRepository(PerformanceReport);

    // Check if data already exists
    const existingReports = await reportRepository.count();
    if (existingReports > 0) {
      console.log("✅ Performance reports already seeded, skipping...");
      return;
    }

    const seedReports = [
      {
        algorithmName: "DistributionCenter",
        simulationData: {
          warehousesOptimized: 3,
          routesAnalyzed: 45,
          costSavings: 12500,
          timeReduction: "18%"
        },
        efficiency: 0.87,
        conclusions: "Distribution center algorithm shows excellent performance with significant cost savings"
      },
      {
        algorithmName: "WarehouseCenter",
        simulationData: {
          packagingOptimized: 250,
          shelvesUtilized: 89,
          handlingTime: "4.2 hours",
          accuracy: "99.7%"
        },
        efficiency: 0.92,
        conclusions: "Warehouse center algorithm achieves near-perfect accuracy with optimal shelf utilization"
      },
      {
        algorithmName: "DistributionCenter",
        simulationData: {
          congestionLevel: "LOW",
          avgDeliveryTime: "2.3 days",
          customerSatisfaction: "4.8/5",
          failureRate: "0.3%"
        },
        efficiency: 0.89,
        conclusions: "Improved distribution network performance with minimal failures"
      }
    ];

    for (const reportData of seedReports) {
      const report = reportRepository.create(reportData);
      await reportRepository.save(report);
      console.log(`✅ Performance report created: ${reportData.algorithmName}`);
    }

    console.log("✅ Performance data seeded successfully");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

seedPerformanceData()
  .then(() => {
    console.log("✅ Performance seed completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Performance seed failed:", error);
    process.exit(1);
  });
