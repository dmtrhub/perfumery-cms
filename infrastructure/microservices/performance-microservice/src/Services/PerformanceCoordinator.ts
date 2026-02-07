import { Repository } from "typeorm";
import { PerformanceReport } from "../Domain/models/PerformanceReport";
import { RunSimulationDTO } from "../Domain/DTOs/RunSimulationDTO";
import { Logger } from "../Infrastructure/Logger";
import { AuditClient } from "../External/AuditClient";
import { PdfGeneratorService } from "./PdfGeneratorService";
import { AlgorithmEnum } from "../Domain/enums/AlgorithmEnum";

export class PerformanceCoordinator {
  private readonly logger: Logger;
  private readonly pdfGenerator: PdfGeneratorService;

  constructor(
    private reportRepository: Repository<PerformanceReport>,
    private auditClient: AuditClient
  ) {
    this.logger = Logger.getInstance();
    this.pdfGenerator = new PdfGeneratorService(auditClient);
  }

  async runSimulation(data: RunSimulationDTO): Promise<PerformanceReport> {
    try {
      this.logger.info("PerformanceCoordinator", `Running simulation for ${data.algorithmName}`);

      // Simuliraj algoritam
      const simulationResult = await this.simulateAlgorithm(data.algorithmName);

      // Kreiraj izveštaj
      const report = this.reportRepository.create({
        algorithmName: data.algorithmName,
        simulationData: {
          totalOperations: simulationResult.totalOperations,
          totalTime: simulationResult.totalTime,
          averageProcessingTime: simulationResult.averageProcessingTime,
          throughput: simulationResult.throughput,
          resourceUtilization: simulationResult.resourceUtilization,
          peakTime: simulationResult.peakTime
        },
        efficiency: simulationResult.efficiency,
        conclusions: simulationResult.conclusions
      });

      const saved = await this.reportRepository.save(report);

      await this.auditClient.logInfo("PERFORMANCE", `Simulation completed: ${saved.id}`);

      this.logger.info("PerformanceCoordinator", `✅ Simulation completed: ${saved.id}`);

      return saved;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error("PerformanceCoordinator", `❌ Simulation failed: ${message}`);
      await this.auditClient.logError("PERFORMANCE", `Simulation failed: ${message}`);
      throw error;
    }
  }

  async getReports(): Promise<PerformanceReport[]> {
    this.logger.info("PerformanceCoordinator", "Fetching all reports");
    return await this.reportRepository.find({
      order: { createdAt: "DESC" }
    });
  }

  async getReportById(id: string): Promise<PerformanceReport | null> {
    this.logger.info("PerformanceCoordinator", `Fetching report ${id}`);
    return await this.reportRepository.findOneBy({ id });
  }

  async exportReportToPdf(reportId: string): Promise<Buffer> {
    try {
      this.logger.info("PerformanceCoordinator", `Exporting report ${reportId} to PDF`);

      const report = await this.reportRepository.findOneBy({ id: reportId });
      if (!report) {
        throw new Error(`Report ${reportId} not found`);
      }

      const pdfBuffer = await this.pdfGenerator.generateReportPdf(report);

      await this.auditClient.logInfo("PERFORMANCE", `Report exported to PDF: ${reportId}`);

      return pdfBuffer;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error("PerformanceCoordinator", `❌ Export failed: ${message}`);
      await this.auditClient.logError("PERFORMANCE", `Export failed: ${message}`);
      throw error;
    }
  }

  private async simulateAlgorithm(algorithmName: AlgorithmEnum): Promise<{
    efficiency: number;
    totalOperations: number;
    totalTime: number;
    averageProcessingTime: number;
    throughput: number;
    resourceUtilization: Record<string, number>;
    peakTime: number;
    conclusions: string;
  }> {
    const totalOperations = Math.floor(Math.random() * 1000) + 100;

    let baseEfficiency: number;
    let baseAvgTime: number;
    let baseMaxTime: number;
    let resourceUtilization: Record<string, number>;

    if (algorithmName === AlgorithmEnum.DISTRIBUTION_CENTER) {
      baseEfficiency = 85 + Math.random() * 10;
      baseAvgTime = 450 + Math.random() * 100;
      baseMaxTime = baseAvgTime * 1.5;
      resourceUtilization = {
        CPU: 70 + Math.random() * 20,
        Memory: 65 + Math.random() * 20,
        Disk: 50 + Math.random() * 15,
        Network: 80 + Math.random() * 15
      };
    } else {
      baseEfficiency = 65 + Math.random() * 15;
      baseAvgTime = 2300 + Math.random() * 300;
      baseMaxTime = baseAvgTime * 1.3;
      resourceUtilization = {
        CPU: 45 + Math.random() * 20,
        Memory: 40 + Math.random() * 20,
        Disk: 35 + Math.random() * 15,
        Network: 50 + Math.random() * 15
      };
    }

    const totalTime = baseAvgTime * totalOperations;
    const throughput = Math.round((totalOperations / totalTime) * 1000);
    const peakTime = Math.round(baseMaxTime);
    const conclusions = this.generateConclusions(algorithmName, baseEfficiency, throughput, totalOperations);

    return {
      efficiency: Math.round(baseEfficiency * 100) / 100,
      totalOperations,
      totalTime: Math.round(totalTime),
      averageProcessingTime: Math.round(baseAvgTime),
      throughput,
      resourceUtilization: Object.fromEntries(
        Object.entries(resourceUtilization).map(([key, val]) => [key, Math.round(val * 100) / 100])
      ),
      peakTime,
      conclusions
    };
  }

  private generateConclusions(
    algorithmName: AlgorithmEnum,
    efficiency: number,
    throughput: number,
    operations: number
  ): string {
    if (algorithmName === AlgorithmEnum.DISTRIBUTION_CENTER) {
      return `DistributionCenter algoritam je pokazao ${efficiency.toFixed(2)}% efikasnosti sa propusnošću od ${throughput} operacija/s za ${operations} obrada.\n\nOvaj algoritam je optimalniji za brze transakcije sa većim brojem ambalaža po slanju (3 ambalaže sa manjim kašnjenjem od 0.5s). Preporučuje se za scenarije sa visokim volumenom i zahtevima za brzinom.\n\nResursi su dobro iskorišćeni sa balansiranim opterećenjem procesora i memorije.`;
    }
    return `WarehouseCenter algoritam je pokazao ${efficiency.toFixed(2)}% efikasnosti sa propusnošću od ${throughput} operacija/s za ${operations} obrada.\n\nOvaj algoritam je optimalniji za precizne, pojedinačne transakcije (1 ambalaža sa kašnjenjem od 2.5s). Preporučuje se za scenarije sa manjim volumenom i visokim zahtevima za pouzdanošću.\n\nResursi su manje opterećeni sa konzervativnom upotrebom procesora i memorije.`;
  }
}
