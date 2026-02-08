import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../hooks/useAuthHook";
import { IProcessingAPI } from "../api/processing/IProcessingAPI";
import { IStorageAPI } from "../api/storage/IStorageAPI";
import { PerfumeDTO, StartProcessingDTO, CreatePackagingDTO, PackagingDTO } from "../models/processing/ProcessingDTO";
import { PerfumeType } from "../enums/PerfumeType";
import { WarehouseDTO } from "../models/storage/StorageDTO";
import { PackagingStatus } from "../enums/PackagingStatus";

type Props = { processingAPI: IProcessingAPI; storageAPI: IStorageAPI };

export const ProcessingPage: React.FC<Props> = ({ processingAPI, storageAPI }) => {
  const { token } = useAuth();
  const [tab, setTab] = useState<"processing" | "packaging" | "packagings">("processing");
  const [perfumes, setPerfumes] = useState<PerfumeDTO[]>([]);
  const [packagings, setPackagings] = useState<PackagingDTO[]>([]);
  const [warehouses, setWarehouses] = useState<WarehouseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showModal, setShowModal] = useState<"start" | "pack" | "send" | null>(null);
  const [selectedSendPackagingId, setSelectedSendPackagingId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState<string>("name");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  const [processForm, setProcessForm] = useState<StartProcessingDTO>({
    perfumeName: "", count: 1, bottleSize: 150, type: PerfumeType.PERFUME, plantCommonName: ""
  });
  const [packForm, setPackForm] = useState<CreatePackagingDTO>({
    name: "", senderAddress: "", warehouseId: "", perfumeIds: []
  });
  const [selectedPerfumeIds, setSelectedPerfumeIds] = useState<string[]>([]);

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [perfs, pkgs, whs] = await Promise.all([
        processingAPI.getAllPerfumes(token),
        processingAPI.getPackagings(token).catch(() => []),
        storageAPI.getAllWarehouses(token).catch(() => [])
      ]);
      setPerfumes(Array.isArray(perfs) ? perfs : []);
      setPackagings(Array.isArray(pkgs) ? pkgs : []);
      setWarehouses(Array.isArray(whs) ? whs : []);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Greska pri ucitavanju");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [token]);

  const filteredPerfumes = useMemo(() => {
    let result = [...perfumes];
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      result = result.filter(p => p.name.toLowerCase().includes(s) || p.serialNumber.toLowerCase().includes(s));
    }
    result.sort((a: any, b: any) => {
      const aV = a[sortField] ?? "";
      const bV = b[sortField] ?? "";
      if (typeof aV === "string") return sortDir === "asc" ? aV.localeCompare(bV) : bV.localeCompare(aV);
      return sortDir === "asc" ? aV - bV : bV - aV;
    });
    return result;
  }, [perfumes, searchTerm, sortField, sortDir]);

  const handleSort = (field: string) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const handleStartProcessing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      await processingAPI.startProcessing(token, processForm);
      setSuccess("Prerada pokrenuta uspesno!");
      setShowModal(null);
      setProcessForm({ perfumeName: "", count: 1, bottleSize: 150, type: PerfumeType.PERFUME, plantCommonName: "" });
      fetchData();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Greska pri pokretanju prerade");
    }
  };

  const handleCreatePackaging = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      await processingAPI.createPackaging(token, { ...packForm, perfumeIds: selectedPerfumeIds });
      setSuccess("Ambalaza kreirana!");
      setShowModal(null);
      setPackForm({ name: "", senderAddress: "", warehouseId: "", perfumeIds: [] });
      setSelectedPerfumeIds([]);
      fetchData();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Greska pri kreiranju ambalaze");
    }
  };

  const togglePerfumeSelection = (id: string) => {
    setSelectedPerfumeIds(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleSendPackaging = async () => {
    if (!token || !selectedSendPackagingId) return;
    try {
      await processingAPI.sendPackaging(token, { packagingId: selectedSendPackagingId });
      setSuccess("Ambalaza poslana u skladiste!");
      setShowModal(null);
      setSelectedSendPackagingId(null);
      fetchData();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Greska pri slanju ambalaze");
    }
  };

  useEffect(() => { if (success || error) { const t = setTimeout(() => { setSuccess(""); setError(""); }, 4000); return () => clearTimeout(t); } }, [success, error]);

  const statusBadge = (s: string) => {
    switch (s) {
      case "CREATED": return <span className="badge badge-green">Kreiran</span>;
      case "PACKED": return <span className="badge badge-yellow">Spakovan</span>;
      case "SOLD": return <span className="badge badge-purple">Prodat</span>;
      default: return <span className="badge badge-blue">{s}</span>;
    }
  };

  return (
    <div>
      <div className="page-header">
        <h1>Prerada</h1>
        <div className="page-header-actions">
          <button className="btn btn-accent" onClick={() => setShowModal("start")}>Zapocni preradu</button>
        </div>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="tabs">
        <button className={`tab ${tab === "processing" ? "active" : ""}`} onClick={() => setTab("processing")}>Parfemi</button>
        <button className={`tab ${tab === "packaging" ? "active" : ""}`} onClick={() => setTab("packaging")}>Pakovanje</button>
        <button className={`tab ${tab === "packagings" ? "active" : ""}`} onClick={() => setTab("packagings")}>Ambalaze za skladiste</button>
      </div>

      {tab === "processing" && (
        <>
          <div className="filter-bar">
            <input type="search" placeholder="Pretrazi parfeme..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
          </div>

          {loading ? (
            <div className="flex justify-center" style={{ padding: 40 }}><div className="spinner"></div></div>
          ) : filteredPerfumes.length === 0 ? (
            <div className="empty-state">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" /></svg>
              <h3>Nema parfema</h3>
              <p>Pokrenite preradu biljaka da biste napravili parfeme</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th onClick={() => handleSort("name")}>Naziv parfema</th>
                    <th>Tip</th>
                    <th onClick={() => handleSort("netQuantityMl")}>Zapremina</th>
                    <th>Serijski broj</th>
                    <th>Rok trajanja</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPerfumes.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600, color: "var(--win11-text-primary)" }}>{p.name}</td>
                      <td>{p.type === PerfumeType.PERFUME ? "Parfem" : "Kolonjska voda"}</td>
                      <td>{p.netQuantityMl} ml</td>
                      <td style={{ fontFamily: "monospace" }}>{p.serialNumber}</td>
                      <td>{new Date(p.expirationDate).toLocaleDateString("sr-RS")}</td>
                      <td>{statusBadge(p.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === "packaging" && (
        <div>
          <h3 style={{ marginBottom: 16 }}>Prerada biljaka u parfeme</h3>
          <p>Izaberite parfeme za pakovanje i posaljite ih u skladiste.</p>
          <div style={{ marginTop: 16 }}>
            {perfumes.filter(p => p.status === "CREATED").length === 0 ? (
              <div className="empty-state">
                <h3>Nema dostupnih parfema za pakovanje</h3>
                <p>Pokrenite preradu da biste napravili nove parfeme</p>
              </div>
            ) : (
              <>
                <p style={{ fontSize: 12, marginBottom: 8, color: "var(--win11-text-tertiary)" }}>Selektujte parfeme za pakovanje:</p>
                <div style={{ overflowX: "auto", maxHeight: 300, overflowY: "auto" }}>
                  <table className="data-table">
                    <thead><tr><th></th><th>Naziv</th><th>Tip</th><th>Kolicina</th><th>Serijski br.</th></tr></thead>
                    <tbody>
                      {perfumes.filter(p => p.status === "CREATED").map(p => (
                        <tr key={p.id} style={{ cursor: "pointer" }} onClick={() => togglePerfumeSelection(p.id)}>
                          <td><input type="checkbox" checked={selectedPerfumeIds.includes(p.id)} readOnly /></td>
                          <td>{p.name}</td>
                          <td>{p.type}</td>
                          <td>{p.netQuantityMl} ml</td>
                          <td style={{ fontFamily: "monospace" }}>{p.serialNumber}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {selectedPerfumeIds.length > 0 && (
                  <button className="btn btn-accent" style={{ marginTop: 12 }} onClick={() => setShowModal("pack")}>
                    Spakuj {selectedPerfumeIds.length} parfem(a) u ambalazu
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {tab === "packagings" && (
        <div>
          <h3 style={{ marginBottom: 16 }}>Ambalaze u skladistu</h3>
          {loading ? (
            <div className="flex justify-center" style={{ padding: 40 }}><div className="spinner"></div></div>
          ) : packagings.length === 0 ? (
            <div className="empty-state">
              <h3>Nema ambalaza</h3>
              <p>Kreirajte ambalaze sa parfemima da biste ih poslali u skladiste</p>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr><th>Naziv</th><th>Broj parfema</th><th>Pošiljaoc</th><th>Status</th><th>Kreirano</th><th>Akcija</th></tr>
                </thead>
                <tbody>
                  {packagings.map(pkg => (
                    <tr key={pkg.id}>
                      <td style={{ fontWeight: 600 }}>{pkg.name}</td>
                      <td>{pkg.perfumeIds?.length || 0}</td>
                      <td style={{ fontSize: 12 }}>{pkg.senderAddress}</td>
                      <td>
                        <span className={`badge ${pkg.status === "SENT" ? "badge-green" : "badge-yellow"}`}>
                          {pkg.status === "SENT" ? "Poslana" : "Kreirana"}
                        </span>
                      </td>
                      <td>{new Date(pkg.createdAt).toLocaleDateString("sr-RS")}</td>
                      <td>
                        {pkg.status === PackagingStatus.PACKED && (
                          <button 
                            className="btn btn-accent" 
                            style={{ fontSize: 11, padding: "4px 10px" }}
                            onClick={() => {
                              setSelectedSendPackagingId(pkg.id);
                              setShowModal("send");
                            }}
                          >
                            Pošalji u skladište
                          </button>
                        )}
                        {pkg.status === PackagingStatus.SENT && (
                          <span style={{ fontSize: 11, color: "var(--win11-text-tertiary)" }}>✓ Poslana</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Start Processing Modal */}
      {showModal === "start" && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Zapocni preradu</h3>
              <button className="btn btn-ghost" onClick={() => setShowModal(null)}>✕</button>
            </div>
            <form onSubmit={handleStartProcessing}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Naziv parfema</label>
                  <input type="text" required value={processForm.perfumeName} onChange={e => setProcessForm({ ...processForm, perfumeName: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Naziv biljke za preradu</label>
                  <input type="text" required value={processForm.plantCommonName} onChange={e => setProcessForm({ ...processForm, plantCommonName: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Broj bocica</label>
                  <input type="number" min="1" required value={processForm.count} onChange={e => setProcessForm({ ...processForm, count: parseInt(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label>Velicina bocice</label>
                  <select value={processForm.bottleSize} onChange={e => setProcessForm({ ...processForm, bottleSize: parseInt(e.target.value) })}>
                    <option value={150}>150 ml</option>
                    <option value={250}>250 ml</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Tip parfema</label>
                  <select value={processForm.type} onChange={e => setProcessForm({ ...processForm, type: e.target.value as PerfumeType })}>
                    <option value={PerfumeType.PERFUME}>Parfem</option>
                    <option value={PerfumeType.COLOGNE}>Kolonjska voda</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-standard" onClick={() => setShowModal(null)}>Otkazi</button>
                <button type="submit" className="btn btn-accent">Pokreni preradu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Create Packaging Modal */}
      {showModal === "pack" && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Kreiraj ambalazu</h3>
              <button className="btn btn-ghost" onClick={() => setShowModal(null)}>✕</button>
            </div>
            <form onSubmit={handleCreatePackaging}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Naziv ambalaze</label>
                  <input type="text" required value={packForm.name} onChange={e => setPackForm({ ...packForm, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Adresa posiljaoca</label>
                  <input type="text" required value={packForm.senderAddress} onChange={e => setPackForm({ ...packForm, senderAddress: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Skladiste</label>
                  <select required value={packForm.warehouseId} onChange={e => setPackForm({ ...packForm, warehouseId: e.target.value })}>
                    <option value="">Izaberite skladiste</option>
                    {warehouses.map(w => <option key={w.id} value={w.id}>{w.name} - {w.location}</option>)}
                  </select>
                </div>
                <p style={{ fontSize: 12, color: "var(--win11-text-tertiary)" }}>Selektovano parfema: {selectedPerfumeIds.length}</p>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-standard" onClick={() => setShowModal(null)}>Otkazi</button>
                <button type="submit" className="btn btn-accent">Kreiraj</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Send Packaging Modal */}
      {showModal === "send" && selectedSendPackagingId && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Pošalji ambalazu u skladište</h3>
              <button className="btn btn-ghost" onClick={() => setShowModal(null)}>✕</button>
            </div>
            <div className="modal-body">
              <p>Da li ste sigurni da želite da pošaljete ovu ambalazu u skladište?</p>
              {packagings.find(p => p.id === selectedSendPackagingId) && (
                <div style={{ marginTop: 16, padding: 12, background: "var(--win11-surface)", borderRadius: 4 }}>
                  <div style={{ fontSize: 13, marginBottom: 8 }}>
                    <strong>{packagings.find(p => p.id === selectedSendPackagingId)?.name}</strong>
                  </div>
                  <div style={{ fontSize: 12, color: "var(--win11-text-secondary)" }}>
                    Broj parfema: {packagings.find(p => p.id === selectedSendPackagingId)?.perfumeIds?.length || 0}
                  </div>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn btn-standard" onClick={() => { setShowModal(null); setSelectedSendPackagingId(null); }}>Otkazi</button>
              <button type="button" className="btn btn-accent" onClick={handleSendPackaging}>Pošalji u skladište</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
