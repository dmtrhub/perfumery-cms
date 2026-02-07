
import PDFDocument from "pdfkit";
import { AnalysisReport } from "../Domain/models/AnalysisReport";
import { Logger } from "../Infrastructure/Logger";
import { IAuditClient } from "../External/IAuditClient";

export class PdfGeneratorService {
  private logger: Logger;
  private auditClient: IAuditClient;

  constructor(auditClient: IAuditClient) {
    this.logger = Logger.getInstance();
    this.auditClient = auditClient;
  }

  async generateReportPdf(report: AnalysisReport): Promise<Buffer> {
    try {
      this.logger.info("PdfGeneratorService", `Generating PDF for report: ${report.id}`);

      return new Promise((resolve, reject) => {
        const chunks: Buffer[] = [];
        const doc = new PDFDocument({ size: "A4", margin: 40 });

        doc.on("data", (chunk) => {
          chunks.push(chunk);
        });

        doc.on("end", () => {
          const buffer = Buffer.concat(chunks);
          this.logger.info("PdfGeneratorService", `PDF generated successfully, size: ${buffer.length} bytes`);
          this.auditClient.logInfo("ANALYTICS", `PDF report generated: ${report.id} (${buffer.length} bytes)`).catch(console.error);
          resolve(buffer);
        });

        doc.on("error", (err) => {
          this.logger.error("PdfGeneratorService", `PDF generation error: ${err}`);
          this.auditClient.logError("ANALYTICS", `PDF generation failed for report ${report.id}: ${err}`).catch(console.error);
          reject(err);
        });

        // Header
        doc.fontSize(24).font("Helvetica-Bold").text("Izveštaj Analize", { align: "center" });
        doc.fontSize(12).font("Helvetica").text(`ID Izveštaja: ${report.id}`, { align: "center" });
        doc.moveDown(0.5);
        doc
          .fontSize(10)
          .text(`Tip: ${report.reportType}`, { align: "center" })
          .text(`Datum: ${new Date(report.createdAt).toLocaleDateString("sr-RS")}`, { align: "center" });
        doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();
        doc.moveDown(1);

        // Report Data
        this.addReportData(doc, report);

        doc.addPage();
        this.addSummary(doc, report);

        doc.end();
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : "Unknown error";
      this.logger.error("PdfGeneratorService", `Error generating PDF: ${message}`);
      this.auditClient.logError("ANALYTICS", `PDF generation exception: ${message}`).catch(console.error);
      throw error;
    }
  }

  private addReportData(doc: any, report: AnalysisReport): void {
    const data = report.data as Record<string, any>;

    // Total Amount
    doc.fontSize(14).font("Helvetica-Bold").text("Ukupni Iznos");
    doc.fontSize(11).font("Helvetica").text(`${data.totalAmount?.toFixed(2) || "N/A"} RSD`, {
      indent: 20
    });
    doc.moveDown(0.5);

    // Total Receipts
    doc.fontSize(14).font("Helvetica-Bold").text("Broj Računa");
    doc.fontSize(11).font("Helvetica").text(`${data.totalReceipts || 0}`, { indent: 20 });
    doc.moveDown(0.5);

    // Average Amount
    doc.fontSize(14).font("Helvetica-Bold").text("Prosečan Iznos");
    doc.fontSize(11).font("Helvetica").text(`${data.averageAmount?.toFixed(2) || "N/A"} RSD`, {
      indent: 20
    });
    doc.moveDown(1);

    // Sale Type Breakdown
    if (data.saleTypeBreakdown) {
      doc.fontSize(14).font("Helvetica-Bold").text("Raspodjela Po Tipu Prodaje");
      Object.entries(data.saleTypeBreakdown).forEach(([type, count]) => {
        doc.fontSize(11).font("Helvetica").text(`${type}: ${count}`, { indent: 20 });
      });
      doc.moveDown(0.5);
    }

    // Payment Method Breakdown
    if (data.paymentMethodBreakdown) {
      doc.fontSize(14).font("Helvetica-Bold").text("Raspodjela Po Načinu Plaćanja");
      Object.entries(data.paymentMethodBreakdown).forEach(([method, count]) => {
        doc.fontSize(11).font("Helvetica").text(`${method}: ${count}`, { indent: 20 });
      });
      doc.moveDown(1);
    }

    // Top Perfumes
    if (data.topPerfumes && Array.isArray(data.topPerfumes)) {
      doc.fontSize(14).font("Helvetica-Bold").text("Top 10 Parfema");
      doc.fontSize(10).font("Helvetica");

      data.topPerfumes.slice(0, 10).forEach((perfume: any, index: number) => {
        doc.text(`${index + 1}. ${perfume.perfumeId || "Unknown"} - Količina: ${perfume.totalQuantity || 0}`, {
          indent: 20
        });
      });
    }
  }

  private addSummary(doc: any, report: AnalysisReport): void {
    const data = report.data as Record<string, any>;

    doc.fontSize(18).font("Helvetica-Bold").text("Rezime Izveštaja");
    doc.moveDown(0.5);

    const summary = `
Ovaj izveštaj prikazuje analizu prodaje za period: ${data.period || "Ukupno"}

Ključne Metrike:
• Ukupan iznos: ${data.totalAmount?.toFixed(2) || "N/A"} RSD
• Broj računa: ${data.totalReceipts || 0}
• Prosečan iznos po računu: ${data.averageAmount?.toFixed(2) || "N/A"} RSD

Najprodavaniji tip prodaje: ${
      Object.entries(data.saleTypeBreakdown || {}).reduce((max: any, [type, count]: any) =>
        count > (max[1] || 0) ? [type, count] : max
      )?.[0] || "N/A"
    }

Najpopularniji način plaćanja: ${
      Object.entries(data.paymentMethodBreakdown || {}).reduce((max: any, [method, count]: any) =>
        count > (max[1] || 0) ? [method, count] : max
      )?.[0] || "N/A"
    }

Izveštaj je generisan: ${new Date(report.createdAt).toLocaleString("sr-RS")}
    `.trim();

    doc.fontSize(11).font("Helvetica").text(summary, {
      align: "left",
      lineGap: 5
    });

    doc.moveDown(2);
    doc.fontSize(9).font("Helvetica").fillColor("gray").text("© 2026 Parfimerija O'Sinјel De Or", {
      align: "center"
    });
  }
}
