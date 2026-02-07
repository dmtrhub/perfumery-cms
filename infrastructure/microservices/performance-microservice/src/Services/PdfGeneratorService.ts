import PDFDocument from "pdfkit";
import { PerformanceReport } from "../Domain/models/PerformanceReport";
import { Logger } from "../Infrastructure/Logger";
import { IAuditClient } from "../External/IAuditClient";

type PDFDocType = any;

export class PdfGeneratorService {
  private logger: Logger;
  private auditClient: IAuditClient;

  constructor(auditClient: IAuditClient) {
    this.logger = Logger.getInstance();
    this.auditClient = auditClient;
  }

  async generateReportPdf(report: PerformanceReport): Promise<Buffer> {
    try {
      this.logger.info("PdfGeneratorService", `Generating PDF for report: ${report.id}`);

      return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        const doc = new PDFDocument({ size: "A4", margin: 40 });

        doc.on("data", (chunk: Buffer) => {
          chunks.push(chunk);
        });

        doc.on("end", () => {
          const buffer = Buffer.concat(chunks);
          this.logger.info("PdfGeneratorService", `PDF generated successfully, size: ${buffer.length} bytes`);
          this.auditClient.logInfo("PERFORMANCE", `PDF report generated: ${report.id} (${buffer.length} bytes)`).catch(console.error);
          resolve(buffer);
        });

        doc.on("error", (err: Error) => {
          this.logger.error("PdfGeneratorService", `PDF generation error: ${err}`);
          this.auditClient.logError("PERFORMANCE", `PDF generation failed for report ${report.id}: ${err}`).catch(console.error);
          reject(err);
        });

        // Header
        doc.fontSize(24).font("Helvetica-Bold").text("Izveštaj Performansi", { align: "center" });
        doc.fontSize(12).font("Helvetica").text(`ID Izveštaja: ${report.id}`, { align: "center" });
        doc.moveDown(0.5);
        doc
          .fontSize(10)
          .text(`Algoritam: ${report.algorithmName}`, { align: "center" })
          .text(`Datum: ${new Date(report.createdAt).toLocaleDateString("sr-RS")}`, {
            align: "center"
          });
        doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
        doc.moveDown(1);

        // Simulation Data
        this.addSimulationData(doc as PDFDocType, report);

        doc.addPage();
        this.addConclusions(doc as PDFDocType, report);

        doc.end();
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error("PdfGeneratorService", `Error generating PDF: ${message}`);
      this.auditClient.logError("PERFORMANCE", `PDF generation exception: ${message}`).catch(console.error);
      throw error;
    }
  }

  private addSimulationData(doc: PDFDocType, report: PerformanceReport): void {
    const data = report.simulationData as Record<string, unknown>;

    // Algorithm Name
    doc.fontSize(14).font("Helvetica-Bold").text("Algoritam");
    doc.fontSize(11).font("Helvetica").text(`${report.algorithmName}`, { indent: 20 });
    doc.moveDown(0.5);

    // Efficiency
    doc.fontSize(14).font("Helvetica-Bold").text("Efikasnost");
    doc.fontSize(11).font("Helvetica").text(`${report.efficiency}%`, { indent: 20 });
    doc.moveDown(0.5);

    // Total Operations
    if (data.totalOperations !== undefined) {
      doc.fontSize(14).font("Helvetica-Bold").text("Ukupno Operacija");
      doc.fontSize(11).font("Helvetica").text(`${data.totalOperations}`, { indent: 20 });
      doc.moveDown(0.5);
    }

    // Total Time
    if (data.totalTime !== undefined) {
      doc.fontSize(14).font("Helvetica-Bold").text("Ukupno Vreme");
      doc.fontSize(11).font("Helvetica").text(`${data.totalTime}ms`, { indent: 20 });
      doc.moveDown(0.5);
    }

    // Average Processing Time
    if (data.averageProcessingTime !== undefined) {
      doc.fontSize(14).font("Helvetica-Bold").text("Prosečno Vreme Obrade");
      doc.fontSize(11).font("Helvetica").text(`${data.averageProcessingTime}ms`, { indent: 20 });
      doc.moveDown(0.5);
    }

    // Throughput
    if (data.throughput !== undefined) {
      doc.fontSize(14).font("Helvetica-Bold").text("Propusnost");
      doc.fontSize(11).font("Helvetica").text(`${data.throughput} operacija/s`, { indent: 20 });
      doc.moveDown(1);
    }

    // Resource Utilization
    if (data.resourceUtilization !== undefined) {
      doc.fontSize(14).font("Helvetica-Bold").text("Iskorišćenost Resursa");
      const resourceUtil = data.resourceUtilization as Record<string, unknown>;
      Object.entries(resourceUtil).forEach(([resource, utilization]) => {
        doc.fontSize(11).font("Helvetica").text(`${resource}: ${utilization}%`, { indent: 20 });
      });
      doc.moveDown(0.5);
    }

    // Peak Time
    if (data.peakTime !== undefined) {
      doc.fontSize(14).font("Helvetica-Bold").text("Vreme Vrha");
      doc.fontSize(11).font("Helvetica").text(`${data.peakTime}ms`, { indent: 20 });
      doc.moveDown(1);
    }
  }

  private addConclusions(doc: PDFDocType, report: PerformanceReport): void {
    doc.fontSize(18).font("Helvetica-Bold").text("Zaključci");
    doc.moveDown(0.5);

    doc.fontSize(11).font("Helvetica").text(report.conclusions, {
      align: "left",
      lineGap: 5,
      width: 475
    });

    doc.moveDown(2);
    doc.fontSize(9).font("Helvetica").fillColor("gray").text("© 2026 Parfimerija O'Sinјel De Or", {
      align: "center"
    });
  }
}
