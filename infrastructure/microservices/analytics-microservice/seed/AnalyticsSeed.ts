import { AppDataSource } from "../src/Database/InitializeConnection";
import { FiscalReceipt } from "../src/Domain/models/FiscalReceipt";
import { AnalysisReport } from "../src/Domain/models/AnalysisReport";
import { SaleType } from "../src/Domain/enums/SaleType";
import { PaymentMethod } from "../src/Domain/enums/PaymentMethod";

async function seedAnalyticsData() {
  try {
    await AppDataSource.initialize();

    const receiptRepository = AppDataSource.getRepository(FiscalReceipt);
    const reportRepository = AppDataSource.getRepository(AnalysisReport);

    // Check if data already exists
    const existingReceipts = await receiptRepository.count();
    if (existingReceipts > 0) {
      console.log("✅ Analysis data already seeded, skipping...");
      return;
    }

    // Using fixed UUIDs for perfumeIds and userIds
    const perfumeIds = [
      "550e8400-e29b-41d4-a716-446655440020",
      "550e8400-e29b-41d4-a716-446655440021",
      "550e8400-e29b-41d4-a716-446655440022"
    ];
    const adminUserId = "550e8400-e29b-41d4-a716-446655440001";
    const managerUserId = "550e8400-e29b-41d4-a716-446655440002";

    const seedReceipts = [
      {
        saleType: SaleType.RETAIL,
        paymentMethod: PaymentMethod.CASH,
        items: [
          { perfumeId: perfumeIds[0], quantity: 2, price: 4500 },
          { perfumeId: perfumeIds[1], quantity: 1, price: 1800 }
        ],
        totalAmount: 10800,
        userId: adminUserId,
        username: "admin"
      },
      {
        saleType: SaleType.WHOLESALE,
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        items: [
          { perfumeId: perfumeIds[2], quantity: 10, price: 3200 }
        ],
        totalAmount: 32000,
        userId: managerUserId,
        username: "sales_manager"
      },
      {
        saleType: SaleType.RETAIL,
        paymentMethod: PaymentMethod.CARD,
        items: [
          { perfumeId: perfumeIds[0], quantity: 1, price: 4500 },
          { perfumeId: perfumeIds[2], quantity: 5, price: 3200 }
        ],
        totalAmount: 20500,
        userId: adminUserId,
        username: "admin"
      },
      {
        saleType: SaleType.WHOLESALE,
        paymentMethod: PaymentMethod.BANK_TRANSFER,
        items: [
          { perfumeId: perfumeIds[1], quantity: 15, price: 1800 }
        ],
        totalAmount: 27000,
        userId: managerUserId,
        username: "sales_manager"
      }
    ];

    for (const receiptData of seedReceipts) {
      const receipt = receiptRepository.create(receiptData);
      await receiptRepository.save(receipt);
      console.log(`✅ Receipt created: ${receiptData.totalAmount} RSD`);
    }

    const seedReports = [
      {
        reportType: "MONTHLY_SALES",
        data: {
          totalRevenue: 90300,
          totalSales: 4,
          avgOrderValue: 22575,
          topProduct: "Rose Eau de Parfum",
          topAmount: 50400
        }
      },
      {
        reportType: "TREND_ANALYSIS",
        data: {
          trend: "UPWARD",
          percentageChange: 18.3,
          forecastedRevenue: 125000,
          recommendedActions: ["Increase inventory", "Target wholesale market"]
        }
      }
    ];

    for (const reportData of seedReports) {
      const report = reportRepository.create(reportData);
      await reportRepository.save(report);
      console.log(`✅ Analysis report created: ${reportData.reportType}`);
    }

    console.log("✅ Analytics data seeded successfully");
  } catch (error) {
    console.error("❌ Seed failed:", error);
    throw error;
  } finally {
    if (AppDataSource.isInitialized) {
      await AppDataSource.destroy();
    }
  }
}

seedAnalyticsData()
  .then(() => {
    console.log("✅ Analytics seed completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Analytics seed failed:", error);
    process.exit(1);
  });
