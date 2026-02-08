import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../hooks/useAuthHook";
import { IProductionAPI } from "../api/production/IProductionAPI";
import { PlantDTO, CreatePlantDTO, HarvestPlantsDTO, AdjustOilIntensityDTO } from "../models/production/PlantDTO";
import { PlantStatus } from "../enums/PlantStatus";

type Props = { productionAPI: IProductionAPI };

export const ProductionPage: React.FC<Props> = ({ productionAPI }) => {
  const { token } = useAuth();
  const [plants, setPlants] = useState<PlantDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showModal, setShowModal] = useState<"create" | "harvest" | "oil" | null>(null);
  const [selectedPlant, setSelectedPlant] = useState<PlantDTO | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
  const [sortField, setSortField] = useState<keyof PlantDTO>("commonName");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");

  // Form states
  const [createForm, setCreateForm] = useState<CreatePlantDTO>({ commonName: "", latinName: "", originCountry: "" });
  const [harvestForm, setHarvestForm] = useState<HarvestPlantsDTO>({ commonName: "", count: 1 });
  const [oilForm, setOilForm] = useState<AdjustOilIntensityDTO>({ percentage: 50 });

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const data = await productionAPI.getAllPlants(token);
      setPlants(Array.isArray(data) ? data : []);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Greska pri ucitavanju biljaka");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [token]);

  const filteredPlants = useMemo(() => {
    let result = [...plants];
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      result = result.filter(p =>
        p.commonName.toLowerCase().includes(s) ||
        p.latinName.toLowerCase().includes(s) ||
        p.originCountry.toLowerCase().includes(s)
      );
    }
    if (filterStatus) {
      result = result.filter(p => p.status === filterStatus);
    }
    result.sort((a, b) => {
      const aVal = a[sortField];
      const bVal = b[sortField];
      if (typeof aVal === "string" && typeof bVal === "string") {
        return sortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === "asc" ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal);
    });
    return result;
  }, [plants, searchTerm, filterStatus, sortField, sortDir]);

  const handleSort = (field: keyof PlantDTO) => {
    if (sortField === field) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortField(field); setSortDir("asc"); }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      await productionAPI.createPlant(token, createForm);
      setSuccess("Biljka uspesno zasadjena!");
      setShowModal(null);
      setCreateForm({ commonName: "", latinName: "", originCountry: "" });
      fetchData();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Greska pri sadjenju biljke");
    }
  };

  const handleHarvest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      await productionAPI.harvestPlants(token, harvestForm);
      setSuccess("Biljke uspesno ubrane!");
      setShowModal(null);
      setHarvestForm({ commonName: "", count: 1 });
      fetchData();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Greska pri berbi");
    }
  };

  const handleOilAdjust = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedPlant) return;
    try {
      const result = await productionAPI.adjustOilStrength(token, selectedPlant.id, oilForm);
      setSuccess("Jacina ulja uspesno promenjena!");
      
      // Ažuriraj selectedPlant sa novom vrednošću iz odgovora servera
      const updatedStrength = result?.data?.aromaticOilStrength || result?.aromaticOilStrength;
      if (updatedStrength !== undefined) {
        setSelectedPlant({
          ...selectedPlant,
          aromaticOilStrength: parseFloat(updatedStrength)
        });
      }
      
      // Reset forma za sledeću promenu - vraćaj na 0
      setOilForm({ percentage: 0 });
    } catch (e: any) {
      setError(e?.response?.data?.message || "Greska pri promeni jacine ulja");
    }
  };

  const handleDelete = async (id: string) => {
    if (!token) return;
    try {
      await productionAPI.deletePlant(token, id);
      setSuccess("Biljka obrisana!");
      fetchData();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Greska pri brisanju");
    }
  };

  const statusBadge = (s: string) => {
    switch (s) {
      case PlantStatus.PLANTED: return <span className="badge badge-green">Posadjena</span>;
      case PlantStatus.HARVESTED: return <span className="badge badge-yellow">Ubrana</span>;
      case PlantStatus.PROCESSED: return <span className="badge badge-purple">Preradjena</span>;
      default: return <span className="badge badge-blue">{s}</span>;
    }
  };

  useEffect(() => { if (success || error) { const t = setTimeout(() => { setSuccess(""); setError(""); }, 4000); return () => clearTimeout(t); } }, [success, error]);

  return (
    <div>
      <div className="page-header">
        <h1>Servis proizvodnje</h1>
        <div className="page-header-actions">
          <button className="btn btn-accent" onClick={() => setShowModal("create")}>+ Zasadi biljku</button>
          <button className="btn btn-standard" onClick={() => setShowModal("harvest")}>Uberi biljke</button>
        </div>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {/* Tabs */}
      <div className="tabs">
        <button className="tab active">Upravljanje biljkama</button>
      </div>

      {/* Filter Bar */}
      <div className="filter-bar">
        <input type="search" placeholder="Pretrazi biljke..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}>
          <option value="">Sva stanja</option>
          <option value={PlantStatus.PLANTED}>Posadjena</option>
          <option value={PlantStatus.HARVESTED}>Ubrana</option>
          <option value={PlantStatus.PROCESSED}>Preradjena</option>
        </select>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex justify-center" style={{ padding: 40 }}><div className="spinner"></div></div>
      ) : filteredPlants.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
          <h3>Nema biljaka</h3>
          <p>Zasadite prvu biljku da biste poceli sa proizvodnjom</p>
        </div>
      ) : (
        <>
          <p style={{ fontSize: 12, color: "var(--win11-text-tertiary)", marginBottom: 8 }}>Ukupno biljaka: {filteredPlants.length}</p>
          <div style={{ overflowX: "auto" }}>
            <table className="data-table">
              <thead>
                <tr>
                  <th onClick={() => handleSort("commonName")}>Naziv {sortField === "commonName" ? (sortDir === "asc" ? "▲" : "▼") : ""}</th>
                  <th onClick={() => handleSort("latinName")}>Latinski naziv {sortField === "latinName" ? (sortDir === "asc" ? "▲" : "▼") : ""}</th>
                  <th onClick={() => handleSort("aromaticOilStrength")}>Jacina {sortField === "aromaticOilStrength" ? (sortDir === "asc" ? "▲" : "▼") : ""}</th>
                  <th>Zemlja</th>
                  <th>Stanje</th>
                  <th>Akcije</th>
                </tr>
              </thead>
              <tbody>
                {filteredPlants.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 600, color: "var(--win11-text-primary)" }}>{p.commonName}</td>
                    <td style={{ fontStyle: "italic" }}>{p.latinName}</td>
                    <td>{p.aromaticOilStrength?.toFixed(1)}</td>
                    <td>{p.originCountry}</td>
                    <td>{statusBadge(p.status)}</td>
                    <td>
                      <div className="flex gap-1">
                        <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12 }} onClick={() => { setSelectedPlant(p); setShowModal("oil"); }}>Promeni ulje</button>
                        <button className="btn btn-ghost" style={{ padding: "4px 8px", fontSize: 12, color: "#f44336" }} onClick={() => handleDelete(p.id)}>Obrisi</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {/* Create Modal */}
      {showModal === "create" && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Zasadi novu biljku</h3>
              <button className="btn btn-ghost" onClick={() => setShowModal(null)}>✕</button>
            </div>
            <form onSubmit={handleCreate}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Naziv biljke</label>
                  <input type="text" required value={createForm.commonName} onChange={e => setCreateForm({ ...createForm, commonName: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Latinski naziv</label>
                  <input type="text" required value={createForm.latinName} onChange={e => setCreateForm({ ...createForm, latinName: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Zemlja porekla</label>
                  <input type="text" required value={createForm.originCountry} onChange={e => setCreateForm({ ...createForm, originCountry: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Jacina ulja (1.0 - 5.0, opciono)</label>
                  <input type="number" step="0.1" min="1" max="5" value={createForm.aromaticOilStrength || ""} onChange={e => setCreateForm({ ...createForm, aromaticOilStrength: e.target.value ? parseFloat(e.target.value) : undefined })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-standard" onClick={() => setShowModal(null)}>Otkazi</button>
                <button type="submit" className="btn btn-accent">Zasadi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Harvest Modal */}
      {showModal === "harvest" && (
        <div className="modal-overlay" onClick={() => setShowModal(null)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Uberi biljke</h3>
              <button className="btn btn-ghost" onClick={() => setShowModal(null)}>✕</button>
            </div>
            <form onSubmit={handleHarvest}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Naziv biljke</label>
                  <input type="text" required value={harvestForm.commonName} onChange={e => setHarvestForm({ ...harvestForm, commonName: e.target.value })} />
                </div>
                <div className="form-group">
                  <label>Broj za berbu</label>
                  <input type="number" min="1" required value={harvestForm.count} onChange={e => setHarvestForm({ ...harvestForm, count: parseInt(e.target.value) })} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-standard" onClick={() => setShowModal(null)}>Otkazi</button>
                <button type="submit" className="btn btn-accent">Uberi</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Oil Adjust Modal */}
      {showModal === "oil" && selectedPlant && (
        <div className="modal-overlay" onClick={() => { setShowModal(null); setSelectedPlant(null); setOilForm({ percentage: 0 }); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Promeni jacinu ulja - {selectedPlant.commonName}</h3>
              <button className="btn btn-ghost" onClick={() => { setShowModal(null); setSelectedPlant(null); setOilForm({ percentage: 0 }); }}>✕</button>
            </div>
            <form onSubmit={handleOilAdjust}>
              <div className="modal-body">
                <p>Trenutna jacina: <strong>{selectedPlant.aromaticOilStrength?.toFixed(1)}</strong></p>
                <p style={{ fontSize: 12, color: "var(--win11-text-tertiary)", marginBottom: 12 }}>
                  Granice: 1.0 - 5.0 (negativne vrednosti smanjuju jacinu)
                </p>
                <div className="form-group" style={{ marginTop: 12 }}>
                  <label>Promeni za procenat (-100% do +100%)</label>
                  <input 
                    type="number" 
                    min="-100" 
                    max="100" 
                    required 
                    value={oilForm.percentage} 
                    onChange={e => setOilForm({ percentage: parseInt(e.target.value) || 0 })} 
                  />
                  <small style={{ color: "var(--win11-text-tertiary)", marginTop: 8, display: "block" }}>
                    Nova vrednost će biti: {(selectedPlant.aromaticOilStrength! * (1 + oilForm.percentage / 100)).toFixed(2)} (sa granicama 1.0-5.0)
                  </small>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-standard" onClick={() => { setShowModal(null); setSelectedPlant(null); setOilForm({ percentage: 0 }); }}>Otkazi</button>
                <button type="submit" className="btn btn-accent">Primeni</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
