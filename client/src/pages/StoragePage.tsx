import React, { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuthHook";
import { IStorageAPI } from "../api/storage/IStorageAPI";
import { WarehouseDTO, CreateWarehouseDTO, StoragePackagingDTO } from "../models/storage/StorageDTO";
import { WarehouseType } from "../enums/WarehouseType";

type Props = { storageAPI: IStorageAPI };

export const StoragePage: React.FC<Props> = ({ storageAPI }) => {
  const { token } = useAuth();
  const [tab, setTab] = useState<"warehouses" | "packagings">("warehouses");
  const [warehouses, setWarehouses] = useState<WarehouseDTO[]>([]);
  const [packagings, setPackagings] = useState<StoragePackagingDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState<CreateWarehouseDTO>({
    name: "", location: "", maxCapacity: 100, type: WarehouseType.DISTRIBUTION_CENTER
  });

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [whs, pkgs] = await Promise.all([
        storageAPI.getAllWarehouses(token),
        storageAPI.getAllPackagings(token).catch(() => [])
      ]);
      setWarehouses(Array.isArray(whs) ? whs : []);
      setPackagings(Array.isArray(pkgs) ? pkgs : []);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Greska pri ucitavanju");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [token]);

  const handleCreateWarehouse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      await storageAPI.createWarehouse(token, createForm);
      setSuccess("Skladiste kreirano!");
      setShowCreate(false);
      setCreateForm({ name: "", location: "", maxCapacity: 100, type: WarehouseType.DISTRIBUTION_CENTER });
      fetchData();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Greska pri kreiranju skladista");
    }
  };

  const getCapacityPercent = (w: WarehouseDTO) => {
    if (!w.maxCapacity) return 0;
    return Math.min(100, Math.round((w.currentCapacity / w.maxCapacity) * 100));
  };

  const getCapacityClass = (pct: number) => {
    if (pct < 60) return "low";
    if (pct < 85) return "medium";
    return "high";
  };

  useEffect(() => { if (success || error) { const t = setTimeout(() => { setSuccess(""); setError(""); }, 4000); return () => clearTimeout(t); } }, [success, error]);

  return (
    <div>
      <div className="page-header">
        <h1>Servis skladistenja</h1>
        <div className="page-header-actions">
          <button className="btn btn-accent" onClick={() => setShowCreate(true)}>+ Novo skladiste</button>
        </div>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="tabs">
        <button className={`tab ${tab === "warehouses" ? "active" : ""}`} onClick={() => setTab("warehouses")}>Skladistenje</button>
        <button className={`tab ${tab === "packagings" ? "active" : ""}`} onClick={() => setTab("packagings")}>Ambalaze za prodaju</button>
      </div>

      {loading ? (
        <div className="flex justify-center" style={{ padding: 40 }}><div className="spinner"></div></div>
      ) : tab === "warehouses" ? (
        <div className="two-col">
          <div>
            <h3 style={{ marginBottom: 16 }}>Skladista</h3>
            {warehouses.length === 0 ? (
              <div className="empty-state"><h3>Nema skladista</h3></div>
            ) : (
              warehouses.map(w => {
                const pct = getCapacityPercent(w);
                return (
                  <div className="warehouse-card" key={w.id}>
                    <div className="warehouse-header">
                      <div>
                        <div className="warehouse-name">{w.name}</div>
                        <div className="warehouse-location">📍 {w.location}</div>
                      </div>
                      <span className={`badge ${w.type === WarehouseType.DISTRIBUTION_CENTER ? "badge-blue" : "badge-orange"}`}>
                        {w.type === WarehouseType.DISTRIBUTION_CENTER ? "Distributivni" : "Magacinski"}
                      </span>
                    </div>
                    <div style={{ fontSize: 13, color: "var(--win11-text-secondary)" }}>
                      Kapacitet: <strong>{w.currentCapacity}</strong> / {w.maxCapacity}
                    </div>
                    <div className="capacity-bar">
                      <div className={`capacity-fill ${getCapacityClass(pct)}`} style={{ width: `${pct}%` }}></div>
                    </div>
                    <div className="capacity-text">{pct}% popunjenost</div>
                  </div>
                );
              })
            )}
          </div>
          <div>
            <h3 style={{ marginBottom: 16 }}>Ambalaze u skladistu</h3>
            {packagings.length === 0 ? (
              <div className="empty-state" style={{ padding: 20 }}><p>Nema ambalaza</p></div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="data-table">
                  <thead><tr><th>ID ambalaze</th><th>Skladiste</th><th>Broj parfema</th><th>Status</th></tr></thead>
                  <tbody>
                    {packagings.map(p => (
                      <tr key={p.id}>
                        <td style={{ fontFamily: "monospace", fontSize: 11 }}>{p.id.substring(0, 8)}...</td>
                        <td>{p.warehouseId?.substring(0, 8)}...</td>
                        <td>{p.perfumeIds?.length || 0}</td>
                        <td>
                          <span className={`badge ${p.status === "STORED" ? "badge-green" : "badge-yellow"}`}>
                            {p.status === "STORED" ? "Uskladistena" : "Poslata"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div>
          <h3>Ambalaze dostupne za prodaju</h3>
          <p style={{ color: "var(--win11-text-tertiary)", fontSize: 13 }}>Posaljite ambalaze iz skladista u serwis prodaje</p>
          {packagings.filter(p => p.status === "STORED").length === 0 ? (
            <div className="empty-state"><h3>Nema dostupnih ambalaza</h3></div>
          ) : (
            <div style={{ overflowX: "auto", marginTop: 16 }}>
              <table className="data-table">
                <thead><tr><th>ID</th><th>Skladiste</th><th>Broj parfema</th><th>Status</th></tr></thead>
                <tbody>
                  {packagings.filter(p => p.status === "STORED").map(p => (
                    <tr key={p.id}>
                      <td style={{ fontFamily: "monospace", fontSize: 11 }}>{p.id.substring(0, 8)}...</td>
                      <td>{p.warehouseId?.substring(0, 8)}...</td>
                      <td>{p.perfumeIds?.length || 0}</td>
                      <td><span className="badge badge-green">Uskladistena</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Create Warehouse Modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Novo skladiste</h3>
              <button className="btn btn-ghost" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            <form onSubmit={handleCreateWarehouse}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Naziv</label>
                  <input type="text" required value={createForm.name} onChange={e => setCreateForm({ ...createForm, name: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Lokacija</label>
                  <input type="text" required value={createForm.location} onChange={e => setCreateForm({ ...createForm, location: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Maksimalni kapacitet</label>
                  <input type="number" min="1" required value={createForm.maxCapacity} onChange={e => setCreateForm({ ...createForm, maxCapacity: parseInt(e.target.value) })} />
                </div>
                <div className="form-group">
                  <label>Tip skladista</label>
                  <select value={createForm.type} onChange={e => setCreateForm({ ...createForm, type: e.target.value as WarehouseType })}>
                    <option value={WarehouseType.DISTRIBUTION_CENTER}>Distributivni centar</option>
                    <option value={WarehouseType.WAREHOUSE_CENTER}>Magacinski centar</option>
                  </select>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-standard" onClick={() => setShowCreate(false)}>Otkazi</button>
                <button type="submit" className="btn btn-accent">Kreiraj</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
