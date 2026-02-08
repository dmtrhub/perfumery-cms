import React, { useState, useEffect, useMemo } from "react";
import { useAuth } from "../hooks/useAuthHook";
import { ISalesAPI } from "../api/sales/ISalesAPI";
import { CatalogItemDTO, PurchaseItemDTO, SalesPackagingDTO } from "../models/sales/SalesDTO";
import { SaleType } from "../enums/SaleType";
import { PaymentMethod } from "../enums/PaymentMethod";

type Props = { salesAPI: ISalesAPI };

export const SalesPage: React.FC<Props> = ({ salesAPI }) => {
  const { token } = useAuth();
  const [tab, setTab] = useState<"catalog" | "packagings">("catalog");
  const [catalog, setCatalog] = useState<CatalogItemDTO[]>([]);
  const [packagings, setPackagings] = useState<SalesPackagingDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [cart, setCart] = useState<Map<string, PurchaseItemDTO>>(new Map());
  const [showPurchase, setShowPurchase] = useState(false);
  const [showRequest, setShowRequest] = useState(false);
  const [saleType, setSaleType] = useState<SaleType>(SaleType.RETAIL);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
  const [requestCount, setRequestCount] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [cat, pkgs] = await Promise.all([
        salesAPI.getCatalog(token).catch(() => []),
        salesAPI.getPackagings(token).catch(() => [])
      ]);
      setCatalog(Array.isArray(cat) ? cat : []);
      setPackagings(Array.isArray(pkgs) ? pkgs : []);
    } catch (e: any) {
      setError(e?.response?.data?.message || "Greska pri ucitavanju");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, [token]);

  const filteredCatalog = useMemo(() => {
    if (!searchTerm) return catalog.filter(c => c.available && c.quantity > 0);
    const s = searchTerm.toLowerCase();
    return catalog.filter(c => c.available && c.quantity > 0 && c.name.toLowerCase().includes(s));
  }, [catalog, searchTerm]);

  const addToCart = (item: CatalogItemDTO) => {
    if (!item.available) {
      setError("Ovaj proizvod nije dostupan!");
      return;
    }
    if (item.quantity <= 0) {
      setError("Nemamo dostupno ovaj proizvod!");
      return;
    }
    setCart(prev => {
      const next = new Map(prev);
      const existing = next.get(item.perfumeId);
      if (existing) {
        if (existing.quantity >= item.quantity) {
          setError(`Maksimalno možete kupiti ${item.quantity} kom. ovog proizvoda!`);
          return prev;
        }
        next.set(item.perfumeId, { ...existing, quantity: existing.quantity + 1 });
      } else {
        next.set(item.perfumeId, { perfumeId: item.perfumeId, quantity: 1 });
      }
      return next;
    });
  };

  const removeFromCart = (perfumeId: string) => {
    setCart(prev => {
      const next = new Map(prev);
      next.delete(perfumeId);
      return next;
    });
  };

  const updateCartQty = (perfumeId: string, qty: number) => {
    if (qty <= 0) { removeFromCart(perfumeId); return; }
    const catalogItem = catalog.find(c => c.perfumeId === perfumeId);
    if (catalogItem && qty > catalogItem.quantity) {
      setError(`Maksimalno možete kupiti ${catalogItem.quantity} kom. ovog proizvoda!`);
      return;
    }
    setCart(prev => {
      const next = new Map(prev);
      const item = next.get(perfumeId);
      if (item) next.set(perfumeId, { ...item, quantity: qty });
      return next;
    });
  };

  const cartItems = Array.from(cart.values());
  const cartTotal = cartItems.reduce((sum, ci) => {
    const catalogItem = catalog.find(c => c.perfumeId === ci.perfumeId);
    return sum + (catalogItem?.price || 0) * ci.quantity;
  }, 0);

  const handlePurchase = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || cartItems.length === 0) return;
    try {
      await salesAPI.purchase(token, { items: cartItems, saleType, paymentMethod });
      setSuccess("Kupovina uspesna!");
      setCart(new Map());
      setShowPurchase(false);
      fetchData();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Greska pri kupovini");
    }
  };

  const handleRequestPackaging = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    try {
      await salesAPI.requestPackaging(token, requestCount);
      setSuccess("Zahtev za ambalazu poslan!");
      setShowRequest(false);
      setRequestCount(1);
      fetchData();
    } catch (e: any) {
      setError(e?.response?.data?.message || "Greska pri zahtevu");
    }
  };

  useEffect(() => { if (success || error) { const t = setTimeout(() => { setSuccess(""); setError(""); }, 4000); return () => clearTimeout(t); } }, [success, error]);

  return (
    <div>
      <div className="page-header">
        <h1>Servis prodaje</h1>
        <div className="page-header-actions">
          <button className="btn btn-standard" onClick={() => setShowRequest(true)}>Zatrazi pakovanja</button>
        </div>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      <div className="tabs">
        <button className={`tab ${tab === "catalog" ? "active" : ""}`} onClick={() => setTab("catalog")}>Katalog
        </button>
        <button className={`tab ${tab === "packagings" ? "active" : ""}`} onClick={() => setTab("packagings")}>Ambalaze</button>
      </div>

      {loading ? (
        <div className="flex justify-center" style={{ padding: 40 }}><div className="spinner"></div></div>
      ) : tab === "catalog" ? (
        <div className="two-col">
          <div>
            <div className="filter-bar">
              <input type="search" placeholder="Pretrazi katalog..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>

            {filteredCatalog.length === 0 ? (
              <div className="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" /></svg>
                <h3>Nema proizvoda u katalogu</h3>
                <p>Zatrazite ambalaze iz skladista</p>
              </div>
            ) : (
              <div className="product-grid">
                {filteredCatalog.map(item => (
                  <div className="product-card" key={item.perfumeId}>
                    <div className="product-name">{item.name}</div>
                    <div className="product-type">{item.type} • {item.netQuantityMl} ml</div>
                    <div className="product-price">{item.price.toFixed(2)} RSD</div>
                    <button className="btn btn-accent" style={{ marginTop: 8 }} onClick={() => addToCart(item)}>
                      Dodaj u korpu
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Cart Panel */}
          <div className="cart-panel">
            <h3 style={{ marginBottom: 16 }}>Korpa ({cartItems.length})</h3>
            {cartItems.length === 0 ? (
              <p style={{ color: "var(--win11-text-tertiary)", fontSize: 13 }}>Korpa je prazna</p>
            ) : (
              <>
                {cartItems.map(ci => {
                  const catItem = catalog.find(c => c.perfumeId === ci.perfumeId);
                  return (
                    <div className="cart-item" key={ci.perfumeId}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 13, color: "var(--win11-text-primary)" }}>{catItem?.name}</div>
                        <div style={{ fontSize: 12, color: "var(--win11-text-tertiary)" }}>{catItem?.price.toFixed(2)} RSD</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <div className="qty-control">
                          <button onClick={() => updateCartQty(ci.perfumeId, ci.quantity - 1)}>−</button>
                          <span>{ci.quantity}</span>
                          <button onClick={() => updateCartQty(ci.perfumeId, ci.quantity + 1)}>+</button>
                        </div>
                        <button className="btn btn-ghost" style={{ padding: 4, color: "#f44336" }} onClick={() => removeFromCart(ci.perfumeId)}>✕</button>
                      </div>
                    </div>
                  );
                })}
                <div className="cart-total">
                  <span>Ukupno:</span>
                  <span style={{ color: "var(--win11-accent)" }}>{cartTotal.toFixed(2)} RSD</span>
                </div>
                <button className="btn btn-accent w-full" onClick={() => setShowPurchase(true)}>Nastavi ka placanju</button>
              </>
            )}
          </div>
        </div>
      ) : tab === "packagings" ? (
        <div>
          {packagings.length === 0 ? (
            <div className="empty-state"><h3>Nema ambalaza</h3></div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table">
                <thead>
                  <tr><th>ID</th><th>Broj parfema</th><th>Status</th><th>Primljeno</th></tr>
                </thead>
                <tbody>
                  {packagings.map(p => (
                    <tr key={p.id}>
                      <td style={{ fontFamily: "monospace", fontSize: 11 }}>{p.id.substring(0, 8)}...</td>
                      <td>{p.perfumeIds?.length || 0}</td>
                      <td><span className={`badge ${p.status === "RECEIVED" ? "badge-green" : "badge-yellow"}`}>{p.status === "RECEIVED" ? "Primljena" : "Raspakovana"}</span></td>
                      <td>{p.receivedAt ? new Date(p.receivedAt).toLocaleDateString("sr-RS") : "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      ) : null}

      {/* Purchase Modal */}
      {showPurchase && (
        <div className="modal-overlay" onClick={() => setShowPurchase(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Zavrsi kupovinu</h3>
              <button className="btn btn-ghost" onClick={() => setShowPurchase(false)}>✕</button>
            </div>
            <form onSubmit={handlePurchase}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Tip prodaje</label>
                  <select value={saleType} onChange={e => setSaleType(e.target.value as SaleType)}>
                    <option value={SaleType.RETAIL}>Maloprodaja</option>
                    <option value={SaleType.WHOLESALE}>Veleprodaja</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Nacin placanja</label>
                  <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value as PaymentMethod)}>
                    <option value={PaymentMethod.CASH}>Gotovina</option>
                    <option value={PaymentMethod.CARD}>Kartica</option>
                    <option value={PaymentMethod.BANK_TRANSFER}>Bankarski transfer</option>
                  </select>
                </div>
                <div className="cart-total" style={{ marginTop: 12 }}>
                  <span>Ukupno:</span>
                  <span style={{ color: "var(--win11-accent)" }}>{cartTotal.toFixed(2)} RSD</span>
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-standard" onClick={() => setShowPurchase(false)}>Otkazi</button>
                <button type="submit" className="btn btn-accent">Potvrdi kupovinu</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Request Packaging Modal */}
      {showRequest && (
        <div className="modal-overlay" onClick={() => setShowRequest(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Zatrazi ambalaze iz skladista</h3>
              <button className="btn btn-ghost" onClick={() => setShowRequest(false)}>✕</button>
            </div>
            <form onSubmit={handleRequestPackaging}>
              <div className="modal-body">
                <div className="form-group">
                  <label>Broj ambalaza</label>
                  <input type="number" min="1" required value={requestCount} onChange={e => setRequestCount(parseInt(e.target.value))} />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" className="btn btn-standard" onClick={() => setShowRequest(false)}>Otkazi</button>
                <button type="submit" className="btn btn-accent">Posalji zahtev</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
