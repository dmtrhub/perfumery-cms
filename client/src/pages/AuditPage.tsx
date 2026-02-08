import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../hooks/useAuthHook";
import { IAuditAPI } from "../api/audit/IAuditAPI";
import { AuditLogDTO } from "../models/audit/AuditDTO";
import { AuditLogType } from "../enums/AuditLogType";

type Props = { auditAPI: IAuditAPI };

export const AuditPage: React.FC<Props> = ({ auditAPI }) => {
  const { token } = useAuth();
  const [logs, setLogs] = useState<AuditLogDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [selectedLog, setSelectedLog] = useState<AuditLogDTO | null>(null);
  const [filterType, setFilterType] = useState("");
  const [filterService, setFilterService] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchLogs = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await auditAPI.getAllLogs(token,
        filterType || undefined,
        filterService || undefined
      );
      setLogs(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Greska pri ucitavanju logova");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchLogs(); }, [token]);

  useEffect(() => { 
    fetchLogs(); 
  }, [filterType, filterService]);

  const filteredLogs = useMemo(() => {
    if (!searchTerm) return logs;
    const s = searchTerm.toLowerCase();
    return logs.filter(l => l.description?.toLowerCase().includes(s));
  }, [logs, searchTerm]);

  const handleDelete = async (id: string) => {
    if (!token) return;
    if (!window.confirm("Da li ste sigurni da zelite da obrisete ovaj log?")) return;
    try {
      await auditAPI.deleteLog(token, id);
      setSuccess("Log obrisan!");
      setLogs(prev => prev.filter(l => l.id !== id));
      if (selectedLog?.id === id) setSelectedLog(null);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Greska pri brisanju");
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case AuditLogType.INFO: return "badge-blue";
      case AuditLogType.WARNING: return "badge-yellow";
      case AuditLogType.ERROR: return "badge-red";
      default: return "badge-blue";
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case AuditLogType.INFO: return "Info";
      case AuditLogType.WARNING: return "Upozorenje";
      case AuditLogType.ERROR: return "Greska";
      default: return type;
    }
  };

  useEffect(() => { if (success || error) { const t = setTimeout(() => { setSuccess(""); setError(""); }, 4000); return () => clearTimeout(t); } }, [success, error]);

  return (
    <div>
      <div className="page-header">
        <h1>Revizija</h1>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="filter-bar">
        <input type="search" placeholder="Pretrazi logove..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        <select value={filterType} onChange={e => { console.log("[Audit] filterType changed to:", e.target.value); setFilterType(e.target.value); }}>
          <option value="">Svi tipovi</option>
          <option value={AuditLogType.INFO}>{AuditLogType.INFO}</option>
          <option value={AuditLogType.WARNING}>{AuditLogType.WARNING}</option>
          <option value={AuditLogType.ERROR}>{AuditLogType.ERROR}</option>
        </select>
        <select value={filterService} onChange={e => { console.log("[Audit] filterService changed to:", e.target.value); setFilterService(e.target.value); }}>
          <option value="">Svi servisi</option>
          <option value="PRODUCTION">PRODUCTION</option>
          <option value="PROCESSING">PROCESSING</option>
          <option value="STORAGE">STORAGE</option>
          <option value="SALES">SALES</option>
          <option value="ANALYTICS">ANALYTICS</option>
          <option value="PERFORMANCE">PERFORMANCE</option>
          <option value="AUTH">AUTH</option>
          <option value="USER">USER</option>
          <option value="AUDIT">AUDIT</option>
          <option value="GATEWAY">GATEWAY</option>
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center" style={{ padding: 40 }}><div className="spinner"></div></div>
      ) : filteredLogs.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          <h3>Nema logova</h3>
          <p>Nema logova koji odgovaraju zadatim filterima</p>
        </div>
      ) : (
        <div className="log-entries">
          {filteredLogs.map(log => (
            <div className={`log-entry log-${log.type?.toLowerCase() || "info"}`} key={log.id} onClick={() => setSelectedLog(log)} style={{ cursor: "pointer" }}>
              <div className="log-entry-header">
                <div className="flex items-center gap-2">
                  <span className={`badge ${getTypeBadge(log.type)}`}>{getTypeLabel(log.type)}</span>
                  <span style={{ fontSize: 12, color: "var(--win11-text-tertiary)", background: "var(--win11-surface)", padding: "2px 8px", borderRadius: 4 }}>{log.serviceName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span style={{ fontSize: 11, color: "var(--win11-text-tertiary)" }}>{new Date(log.timestamp).toLocaleString("sr-RS")}</span>
                  <button className="btn btn-ghost" style={{ padding: 4, color: "#f44336", fontSize: 11 }} onClick={e => { e.stopPropagation(); handleDelete(log.id); }}>Obrisi</button>
                </div>
              </div>
              <div style={{ fontSize: 13, color: "var(--win11-text-primary)", marginTop: 4 }}>{log.description}</div>
            </div>
          ))}
        </div>
      )}

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="modal-overlay" onClick={() => setSelectedLog(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Detalji loga</h3>
              <button className="btn btn-ghost" onClick={() => setSelectedLog(null)}>✕</button>
            </div>
            <div className="modal-body">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 16 }}>
                <div><span style={{ fontSize: 11, color: "var(--win11-text-tertiary)" }}>ID</span><div style={{ fontSize: 12, fontFamily: "monospace" }}>{selectedLog.id}</div></div>
                <div><span style={{ fontSize: 11, color: "var(--win11-text-tertiary)" }}>Tip</span><div><span className={`badge ${getTypeBadge(selectedLog.type)}`}>{getTypeLabel(selectedLog.type)}</span></div></div>
                <div><span style={{ fontSize: 11, color: "var(--win11-text-tertiary)" }}>Servis</span><div style={{ fontSize: 13 }}>{selectedLog.serviceName}</div></div>
                <div><span style={{ fontSize: 11, color: "var(--win11-text-tertiary)" }}>Datum</span><div style={{ fontSize: 13 }}>{new Date(selectedLog.timestamp).toLocaleString("sr-RS")}</div></div>
              </div>
              <div style={{ marginBottom: 12 }}><span style={{ fontSize: 11, color: "var(--win11-text-tertiary)" }}>Opis</span><div style={{ fontSize: 13 }}>{selectedLog.description}</div></div>
              {selectedLog.userId && (
                <div style={{ marginBottom: 12 }}><span style={{ fontSize: 11, color: "var(--win11-text-tertiary)" }}>Korisnik ID</span><div style={{ fontSize: 12, fontFamily: "monospace" }}>{selectedLog.userId}</div></div>
              )}
              {selectedLog.ipAddress && (
                <div>
                  <span style={{ fontSize: 11, color: "var(--win11-text-tertiary)" }}>IP Adresa</span>
                  <div style={{ fontSize: 12, fontFamily: "monospace" }}>{selectedLog.ipAddress}</div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-standard" style={{ color: "#f44336" }} onClick={() => { handleDelete(selectedLog.id); }}>Obrisi</button>
              <button className="btn btn-standard" onClick={() => setSelectedLog(null)}>Zatvori</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
