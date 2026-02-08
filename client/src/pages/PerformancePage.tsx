import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuthHook";
import { IPerformanceAPI } from "../api/performance/IPerformanceAPI";
import { PerformanceReportDTO } from "../models/performance/PerformanceDTO";
import { AlgorithmEnum } from "../enums/AlgorithmEnum";

type Props = { performanceAPI: IPerformanceAPI };

export const PerformancePage: React.FC<Props> = ({ performanceAPI }) => {
  const { token } = useAuth();
  const [tab, setTab] = useState<"simulate" | "reports">("simulate");
  const [reports, setReports] = useState<PerformanceReportDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [algorithm, setAlgorithm] = useState<AlgorithmEnum>(AlgorithmEnum.DistributionCenter);
  const [simulationResult, setSimulationResult] = useState<PerformanceReportDTO | null>(null);

  const fetchReports = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await performanceAPI.getReports(token);
      setReports(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Greska pri ucitavanju izvestaja");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (tab === "reports") fetchReports(); }, [token, tab]);

  const handleSimulate = async () => {
    if (!token) return;
    setSimulating(true);
    setSimulationResult(null);
    try {
      const result = await performanceAPI.simulate(token, algorithm);
      setSimulationResult(result);
      setSuccess("Simulacija zavrsena!");
    } catch (e: any) {
      setError(e?.response?.data?.message || "Greska pri simulaciji");
    } finally {
      setSimulating(false);
    }
  };

  const handleExportReport = async (reportId: string) => {
    if (!token) return;
    try {
      const blob = await performanceAPI.exportReport(token, reportId);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `perf-report-${reportId.substring(0, 8)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
      setSuccess("Izvestaj eksportovan!");
    } catch (e: any) {
      setError(e?.response?.data?.message || "Greska pri eksportu");
    }
  };

  useEffect(() => { if (success || error) { const t = setTimeout(() => { setSuccess(""); setError(""); }, 4000); return () => clearTimeout(t); } }, [success, error]);

  return (
    <div>
      <div className="page-header">
        <h1>Performanse</h1>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="tabs">
        <button className={`tab ${tab === "simulate" ? "active" : ""}`} onClick={() => setTab("simulate")}>Simulacija</button>
        <button className={`tab ${tab === "reports" ? "active" : ""}`} onClick={() => setTab("reports")}>Izvestaji</button>
      </div>

      {tab === "simulate" ? (
        <div>
          <div style={{ maxWidth: 500 }}>
            <div className="form-group">
              <label>Algoritam simulacije</label>
              <select value={algorithm} onChange={e => setAlgorithm(e.target.value as AlgorithmEnum)}>
                <option value={AlgorithmEnum.DistributionCenter}>Distributivni centar</option>
                <option value={AlgorithmEnum.WarehouseCenter}>Skladisni centar</option>
              </select>
            </div>
            <button className="btn btn-accent" onClick={handleSimulate} disabled={simulating}>
              {simulating ? (
                <span className="flex items-center gap-2"><span className="spinner" style={{ width: 16, height: 16 }}></span> Simulacija u toku...</span>
              ) : "Pokreni simulaciju"}
            </button>
          </div>

          {simulationResult && (
            <div style={{ marginTop: 32 }}>
              <h3 style={{ fontSize: 15, fontWeight: 600, marginBottom: 16, color: "var(--win11-text-primary)" }}>Rezultat simulacije</h3>
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">{simulationResult.algorithmName === "DistributionCenter" ? "Distributivni centar" : "Skladisni centar"}</div>
                  <div className="stat-label">Algoritam</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value" style={{ 
                    color: simulationResult.efficiency && simulationResult.efficiency > 80 
                      ? "#4caf50" 
                      : simulationResult.efficiency && simulationResult.efficiency > 50 
                        ? "#ff9800" 
                        : "#f44336",
                    fontSize: 28
                  }}>
                    {simulationResult.efficiency !== undefined ? simulationResult.efficiency.toFixed(2) : "0"}%
                  </div>
                  <div className="stat-label">Efikasnost</div>
                </div>
              </div>

              {/* Efficiency Bar Visual */}
              {simulationResult.efficiency !== undefined && (
                <div style={{ marginTop: 20, padding: 16, background: "var(--win11-surface)", borderRadius: 8, border: "1px solid var(--win11-border)" }}>
                  <h4 style={{ fontSize: 13, marginBottom: 12, color: "var(--win11-text-primary)" }}>Vizuelni prikaz efikasnosti</h4>
                  <div style={{ 
                    width: "100%", 
                    height: 30, 
                    background: "var(--win11-surface-tertiary)", 
                    borderRadius: 4, 
                    overflow: "hidden",
                    border: "1px solid var(--win11-border)"
                  }}>
                    <div 
                      style={{
                        width: `${Math.min(simulationResult.efficiency, 100)}%`,
                        height: "100%",
                        background: simulationResult.efficiency > 80 
                          ? "linear-gradient(90deg, #4caf50, #45a049)" 
                          : simulationResult.efficiency > 50 
                            ? "linear-gradient(90deg, #ff9800, #fb8c00)" 
                            : "linear-gradient(90deg, #f44336, #da190b)",
                        transition: "width 0.3s ease",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        fontWeight: 600,
                        color: "#fff",
                        textShadow: "0 1px 2px rgba(0,0,0,0.3)"
                      }}
                    >
                      {simulationResult.efficiency.toFixed(2)}%
                    </div>
                  </div>
                  <div style={{ marginTop: 8, fontSize: 12, color: "var(--win11-text-secondary)" }}>
                    <span style={{ color: "#4caf50" }}>► Odličan: 80% i više</span> | <span style={{ color: "#ff9800" }}>► Dobar: 50-80%</span> | <span style={{ color: "#f44336" }}>► Loš: ispod 50%</span>
                  </div>
                </div>
              )}

              {simulationResult.conclusions && (
                <div style={{ marginTop: 16, padding: 12, background: "var(--win11-accent-light)", borderRadius: 6, borderLeft: "4px solid var(--win11-accent)" }}>
                  <h4 style={{ fontSize: 13, marginBottom: 6, color: "var(--win11-text-primary)" }}>Zaključak</h4>
                  <p style={{ fontSize: 13, color: "var(--win11-text-secondary)", margin: 0 }}>{simulationResult.conclusions}</p>
                </div>
              )}

              {simulationResult.simulationData && (
                <div style={{ marginTop: 16, padding: 16, background: "var(--win11-surface)", borderRadius: 8, border: "1px solid var(--win11-border)" }}>
                  <h4 style={{ fontSize: 13, marginBottom: 8 }}>Detalji simulacije:</h4>
                  <pre style={{ fontSize: 12, whiteSpace: "pre-wrap", color: "var(--win11-text-secondary)", fontFamily: "Cascadia Code, Consolas, monospace", maxHeight: 300, overflow: "auto" }}>
                    {JSON.stringify(simulationResult.simulationData, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        <div>
          {loading ? (
            <div className="flex justify-center" style={{ padding: 40 }}><div className="spinner"></div></div>
          ) : reports.length === 0 ? (
            <div className="empty-state"><h3>Nema prethodnih izvestaja</h3><p>Pokrenite simulaciju da generisete izvestaj</p></div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr><th>ID</th><th>Algoritam</th><th>Efikasnost</th><th>Zakljucak</th><th>Datum</th><th>Akcije</th></tr>
                </thead>
                <tbody>
                  {reports.map(r => (
                    <tr key={r.id}>
                      <td style={{ fontFamily: "monospace", fontSize: 11 }}>{r.id.substring(0, 8)}...</td>
                      <td>{r.algorithmName === "DistributionCenter" ? "Distributivni centar" : "Skladisni centar"}</td>
                      <td>
                        {r.efficiency !== undefined ? (
                          <span style={{ color: r.efficiency > 80 ? "#4caf50" : r.efficiency > 50 ? "#ff9800" : "#f44336", fontWeight: 600 }}>
                            {r.efficiency.toFixed(2)}%
                          </span>
                        ) : "-"}
                      </td>
                      <td>{r.conclusions || "-"}</td>
                      <td>{new Date(r.createdAt).toLocaleDateString("sr-RS")}</td>
                      <td>
                        <button className="btn btn-accent" style={{ fontSize: 11, padding: "4px 10px" }} onClick={() => handleExportReport(r.id)}>Eksportuj PDF</button>
                      </td>
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
