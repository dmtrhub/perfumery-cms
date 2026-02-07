import { AppDataSource } from "../src/Database/InitializeConnection";
import { AuditLog } from "../src/Domain/models/AuditLog";
import { AuditLogType } from "../src/Domain/enums/AuditLogType";
import { ServiceType } from "../src/Domain/enums/ServiceType";

async function seedAuditLogs() {
  await AppDataSource.initialize();

  const auditRepository = AppDataSource.getRepository(AuditLog);

  const seedLogs = [
    {
      type: AuditLogType.INFO,
      serviceName: ServiceType.AUDIT,
      description: "Audit service started successfully",
      userId: undefined,
      ipAddress: "127.0.0.1"
    },
    {
      type: AuditLogType.INFO,
      serviceName: ServiceType.PRODUCTION,
      description: "Plant seeded: Rosa damascena from Bulgaria",
      userId: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      ipAddress: "192.168.1.100"
    },
    {
      type: AuditLogType.INFO,
      serviceName: ServiceType.PROCESSING,
      description: "Perfume created: Rose Eau de Parfum (250ml)",
      userId: "f47ac10b-58cc-4372-a567-0e02b2c3d479",
      ipAddress: "192.168.1.100"
    }
  ];

  for (const logData of seedLogs) {
    const log = auditRepository.create(logData);
    await auditRepository.save(log);
  }

  console.log("✅ Audit logs seeded successfully");
  await AppDataSource.destroy();
}

seedAuditLogs().catch(error => {
  console.error("❌ Seed failed:", error);
  process.exit(1);
});