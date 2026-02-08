import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../hooks/useAuthHook";
import { IAnalyticsAPI } from "../api/analytics/IAnalyticsAPI";
import { FiscalReceiptDTO, SalesTotalDTO, SalesTrendDTO, TopPerfumeDTO, AnalysisReportDTO } from "../models/analytics/AnalyticsDTO";

type Props = { analyticsAPI: IAnalyticsAPI };

export const AnalyticsPage: React.FC<Props> = ({ analyticsAPI }) => {
  const { token } = useAuth();
  const [tab, setTab] = useState<"overview" | "receipts" | "reports">("overview");
  const [receipts, setReceipts] = useState<FiscalReceiptDTO[]>([]);
  const [salesTotal, setSalesTotal] = useState<SalesTotalDTO | null>(null);
  const [salesTrend, setSalesTrend] = useState<SalesTrendDTO[]>([]);
  const [topPerfumes, setTopPerfumes] = useState<TopPerfumeDTO[]>([]);
  const [reports, setReports] = useState<AnalysisReportDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedReceipt, setSelectedReceipt] = useState<FiscalReceiptDTO | null>(null);
  const [totalPeriod, setTotalPeriod] = useState("month");

  const fetchOverview = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [total, trend, top] = await Promise.all([
        analyticsAPI.getSalesTotal(token, totalPeriod).catch(() => null),
        analyticsAPI.getSalesTrend(token, totalPeriod).catch(() => []),
        analyticsAPI.getTop10(token, totalPeriod).catch(() => [])
      ]);
      setSalesTotal(total);
      setSalesTrend(Array.isArray(trend) ? trend : []);
      setTopPerfumes(Array.isArray(top) ? top : []);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Greska pri ucitavanju");
    } finally {
      setLoading(false);
    }
  };

  const fetchReceipts = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await analyticsAPI.getReceipts(token);
      setReceipts(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Greska pri ucitavanju racuna");
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await analyticsAPI.getReports(token);
      setReports(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Greska pri ucitavanju izvestaja");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (tab === "overview") fetchOverview();
    else if (tab === "receipts") fetchReceipts();
    else if (tab === "reports") fetchReports();
  }, [token, tab, totalPeriod]);

  const handleExportReport = async (reportId: string) => {
    if (!token) return;
    try {
      const blob = await analyticsAPI.exportReport(token, reportId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `report-${reportId.substring(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setSuccess("Izvestaj eksportovan!");
    } catch (e: any) {
      setError(e?.response?.data?.message || "Greska pri eksportu");
    }
  };

  const trendMax = useMemo(() => Math.max(...salesTrend.map(t => t.totalAmount || 0), 1), [salesTrend]);

  useEffect(() => { if (success || error) { const t = setTimeout(() => { setSuccess(""); setError(""); }, 4000); return () => clearTimeout(t); } }, [success, error]);

  return (
    <div>
      <div className="page-header">
        <h1>Analitika</h1>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="tabs">
        <button className={`tab ${tab === "overview" ? "active" : ""}`} onClick={() => setTab("overview")}>Pregled</button>
        <button className={`tab ${tab === "receipts" ? "active" : ""}`} onClick={() => setTab("receipts")}>Fiskalni racuni</button>
        <button className={`tab ${tab === "reports" ? "active" : ""}`} onClick={() => setTab("reports")}>Izvestaji</button>
      </div>

      {loading ? (
        <div className="flex justify-center" style={{ padding: 40 }}><div className="spinner"></div></div>
      ) : tab === "overview" ? (
        <div>
          {/* Sales Total Card */}
          <div className="filter-bar" style={{ marginBottom: 24 }}>
            <select value={totalPeriod} onChange={e => setTotalPeriod(e.target.value)}>
              <option value="day">Danas</option>
              <option value="week">Ova nedelja</option>
              <option value="month">Ovaj mesec</option>
              <option value="year">Ova godina</option>
            </select>
          </div>

          {salesTotal && (
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-value">{salesTotal.totalRevenue?.toFixed(2) || "0.00"}</div>
                <div className="stat-label">Ukupan prihod (RSD)</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{salesTotal.totalReceipts || 0}</div>
                <div className="stat-label">Broj prodaja</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{salesTotal.totalItemsSold || 0}</div>
                <div className="stat-label">Prodatih artikala</div>
              </div>
              <div className="stat-card">
                <div className="stat-value">{salesTotal.averageOrderValue?.toFixed(2) || "0.00"}</div>
                <div className="stat-label">Prosecna vrednost</div>
              </div>
            </div>
          )}

          <div className="charts-grid">
            {/* Sales Trend */}
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Trend prodaje</h3>
              {salesTrend.length === 0 ? (
                <p style={{ color: "var(--win11-text-tertiary)", fontSize: 13 }}>Nema podataka o trendu</p>
              ) : (
                <div className="bar-chart">
                  {salesTrend.map((t, i) => (
                    <div className="bar-item" key={i}>
                      <div className="bar" style={{ height: `${(t.totalAmount / trendMax) * 100}%` }} title={`${t.totalAmount.toFixed(0)} RSD`}></div>
                      <span className="bar-label">{t.date}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top 10 Perfumes */}
            <div>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16 }}>Top 10 parfema</h3>
              {topPerfumes.length === 0 ? (
                <p style={{ color: "var(--win11-text-tertiary)", fontSize: 13 }}>Nema podataka</p>
              ) : (
                <div>
                  {topPerfumes.map((p, i) => (
                    <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "8px 0", borderBottom: "1px solid var(--win11-border)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 700, background: i < 3 ? "var(--win11-accent)" : "var(--win11-border)", color: i < 3 ? "#000" : "var(--win11-text-primary)" }}>{i + 1}</span>
                        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--win11-text-primary)" }}>{p.name || `Parfem ${p.perfumeId?.substring(0, 8) || "?"}`}</span>
                      </div>
                      <div style={{ textAlign: "right" }}>
                        <div style={{ fontSize: 13, fontWeight: 600, color: "var(--win11-accent)" }}>{p.quantity} kom</div>
                        <div style={{ fontSize: 11, color: "var(--win11-text-tertiary)" }}>{p.revenue?.toFixed(0)} RSD</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : tab === "receipts" ? (
        <div>
          {receipts.length === 0 ? (
            <div className="empty-state"><h3>Nema fiskalnih racuna</h3></div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr><th>ID</th><th>Datum</th><th>Tip</th><th>Placanje</th><th>Ukupno</th><th>Akcije</th></tr>
                </thead>
                <tbody>
                  {receipts.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontFamily: "monospace", fontSize: 11 }}>{r.id.substring(0, 8)}...</td>
                      <td>{new Date(r.createdAt).toLocaleDateString("sr-RS")}</td>
                      <td><span className="badge badge-blue">{r.saleType === "RETAIL" ? "Maloprodaja" : "Veleprodaja"}</span></td>
                      <td>{r.paymentMethod === "CASH" ? "Gotovina" : r.paymentMethod === "CARD" ? "Kartica" : "Transfer"}</td>
                      <td style={{ fontWeight: 600, color: "var(--win11-accent)" }}>{r.totalAmount?.toFixed(2)} RSD</td>
                      <td><button className="btn btn-ghost" onClick={() => setSelectedReceipt(r)}>Detalji</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Receipt Detail Modal */}
          {selectedReceipt && (
            <div className="modal-overlay" onClick={() => setSelectedReceipt(null)}>
              <div className="modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>Racun #{selectedReceipt.id.substring(0, 8)}</h3>
                  <button className="btn btn-ghost" onClick={() => setSelectedReceipt(null)}>✕</button>
                </div>
                <div className="modal-body">
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                    <div><span style={{ fontSize: 11, color: "var(--win11-text-tertiary)" }}>Datum</span><div style={{ fontSize: 13 }}>{new Date(selectedReceipt.createdAt).toLocaleString("sr-RS")}</div></div>
                    <div><span style={{ fontSize: 11, color: "var(--win11-text-tertiary)" }}>Tip prodaje</span><div style={{ fontSize: 13 }}>{selectedReceipt.saleType === "RETAIL" ? "Maloprodaja" : "Veleprodaja"}</div></div>
                    <div><span style={{ fontSize: 11, color: "var(--win11-text-tertiary)" }}>Nacin placanja</span><div style={{ fontSize: 13 }}>{selectedReceipt.paymentMethod === "CASH" ? "Gotovina" : selectedReceipt.paymentMethod === "CARD" ? "Kartica" : "Transfer"}</div></div>
                    <div><span style={{ fontSize: 11, color: "var(--win11-text-tertiary)" }}>Ukupno</span><div style={{ fontSize: 15, fontWeight: 700, color: "var(--win11-accent)" }}>{selectedReceipt.totalAmount?.toFixed(2)} RSD</div></div>
                  </div>
                  {selectedReceipt.items && selectedReceipt.items.length > 0 && (
                    <div>
                      <h4 style={{ fontSize: 13, marginBottom: 8 }}>Stavke:</h4>
                      {selectedReceipt.items.map((item: any, i: number) => (
                        <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--win11-border)", fontSize: 13 }}>
                          <span>{item.name || item.perfumeId?.substring(0, 8)}</span>
                          <span>{item.quantity} × {item.price?.toFixed(2)} RSD</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="modal-footer">
                  <button className="btn btn-standard" onClick={() => setSelectedReceipt(null)}>Zatvori</button>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div>
          {reports.length === 0 ? (
            <div className="empty-state"><h3>Nema izvestaja</h3></div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr><th>ID</th><th>Naslov</th><th>Datum</th><th>Akcije</th></tr>
                </thead>
                <tbody>
                  {reports.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontFamily: "monospace", fontSize: 11 }}>{r.id.substring(0, 8)}...</td>
                      <td>{r.reportType || "Izvestaj"}</td>
                      <td>{new Date(r.createdAt).toLocaleDateString("sr-RS")}</td>
                      <td><button className="btn btn-accent" style={{ fontSize: 11, padding: "4px 10px" }} onClick={() => handleExportReport(r.id)}>Eksportuj PDF</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
