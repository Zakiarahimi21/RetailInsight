import { useState, useEffect, useCallback } from "react";
import Modal from "../../components/Modal";
import Pagination from "../../components/Pagination";
import { transactionsApi, productsApi, customersApi } from "../../api/resources";

const emptyItem = { product_id: "", quantity: 1, unit_price: "" };

export default function TransactionsTab() {
  const [data, setData] = useState({ items: [], page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [error, setError] = useState("");

  const [invoiceNo, setInvoiceNo] = useState("");
  const [customerId, setCustomerId] = useState("");
  const [txnDate, setTxnDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [items, setItems] = useState([{ ...emptyItem }]);

  const load = useCallback((page = 1) => {
    transactionsApi.list({ page, search }).then(setData);
  }, [search]);

  useEffect(() => { load(1); }, [load]);
  useEffect(() => {
    productsApi.list({ per_page: 100 }).then((d) => setProducts(d.items));
    customersApi.list({ per_page: 100 }).then((d) => setCustomers(d.items));
  }, []);

  const openAdd = () => {
    setInvoiceNo("");
    setCustomerId("");
    setTxnDate(new Date().toISOString().slice(0, 10));
    setItems([{ ...emptyItem }]);
    setError("");
    setModalOpen(true);
  };

  const updateItem = (idx, field, value) => {
    setItems((prev) => {
      const next = [...prev];
      next[idx] = { ...next[idx], [field]: value };
      if (field === "product_id") {
        const product = products.find((p) => String(p.id) === String(value));
        if (product) next[idx].unit_price = product.unit_price;
      }
      return next;
    });
  };

  const addItemRow = () => setItems((prev) => [...prev, { ...emptyItem }]);
  const removeItemRow = (idx) => setItems((prev) => prev.filter((_, i) => i !== idx));

  const save = async (e) => {
    e.preventDefault();
    const validItems = items.filter((i) => i.product_id && i.quantity > 0);
    if (validItems.length === 0) {
      setError("Add at least one product line.");
      return;
    }
    try {
      await transactionsApi.create({
        invoice_no: invoiceNo || undefined,
        customer_id: customerId || undefined,
        transaction_date: `${txnDate}T00:00:00`,
        items: validItems.map((i) => ({
          product_id: Number(i.product_id),
          quantity: Number(i.quantity),
          unit_price: Number(i.unit_price),
        })),
      });
      setModalOpen(false);
      load(data.page);
    } catch (err) {
      setError(err.response?.data?.errors?.items?.[0] || "Something went wrong.");
    }
  };

  const remove = async (t) => {
    if (!confirm(`Delete transaction ${t.invoice_no || t.id}? Stock will be restored.`)) return;
    await transactionsApi.remove(t.id);
    load(data.page);
  };

  return (
    <>
      <div className="ri-toolbar">
        <div className="ri-search-input">
          <i className="bi bi-search" />
          <input placeholder="Search by invoice no..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button className="ri-btn ri-btn-primary" onClick={openAdd}>
          <i className="bi bi-plus-lg" /> New Transaction
        </button>
      </div>

      <div className="ri-table-wrap">
        <table className="ri-table">
          <thead>
            <tr><th>Invoice</th><th>Customer</th><th>Date</th><th>Items</th><th>Total</th><th>Profit</th><th></th></tr>
          </thead>
          <tbody>
            {data.items.length === 0 && (
              <tr><td colSpan={7} style={{ textAlign: "center", color: "var(--ri-text-muted)" }}>No transactions yet.</td></tr>
            )}
            {data.items.map((t) => (
              <tr key={t.id}>
                <td>{t.invoice_no || `#${t.id}`}</td>
                <td>{t.customer || "—"}</td>
                <td>{new Date(t.transaction_date).toLocaleDateString()}</td>
                <td>{t.items.length}</td>
                <td>${t.total.toFixed(2)}</td>
                <td>${t.profit.toFixed(2)}</td>
                <td>
                  <button className="ri-icon-btn danger" onClick={() => remove(t)}><i className="bi bi-trash" /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination {...data} onPageChange={load} />
      </div>

      {modalOpen && (
        <Modal title="New Transaction" onClose={() => setModalOpen(false)}>
          {error && <div className="ri-alert ri-alert-error">{error}</div>}
          <form onSubmit={save}>
            <div className="ri-field">
              <label>Invoice No (optional)</label>
              <input value={invoiceNo} onChange={(e) => setInvoiceNo(e.target.value)} />
            </div>
            <div className="ri-field">
              <label>Customer (optional)</label>
              <select
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value)}
                style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: 14, border: "1.5px solid #d9e6e0" }}
              >
                <option value="">— Walk-in / none —</option>
                {customers.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="ri-field">
              <label>Date</label>
              <input type="date" value={txnDate} onChange={(e) => setTxnDate(e.target.value)} required />
            </div>

            <label style={{ fontSize: "0.85rem", fontWeight: 600 }}>Line Items</label>
            {items.map((item, idx) => (
              <div key={idx} style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", alignItems: "center" }}>
                <select
                  value={item.product_id}
                  onChange={(e) => updateItem(idx, "product_id", e.target.value)}
                  style={{ flex: 2, padding: "0.6rem", borderRadius: 10, border: "1.5px solid #d9e6e0" }}
                >
                  <option value="">Select product</option>
                  {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
                <input
                  type="number" min="1" placeholder="Qty" value={item.quantity}
                  onChange={(e) => updateItem(idx, "quantity", e.target.value)}
                  style={{ width: "70px", padding: "0.6rem", borderRadius: 10, border: "1.5px solid #d9e6e0" }}
                />
                <input
                  type="number" step="0.01" placeholder="Price" value={item.unit_price}
                  onChange={(e) => updateItem(idx, "unit_price", e.target.value)}
                  style={{ width: "90px", padding: "0.6rem", borderRadius: 10, border: "1.5px solid #d9e6e0" }}
                />
                {items.length > 1 && (
                  <button type="button" className="ri-icon-btn danger" onClick={() => removeItemRow(idx)}>
                    <i className="bi bi-x" />
                  </button>
                )}
              </div>
            ))}
            <button type="button" className="ri-btn ri-btn-outline" style={{ marginTop: "0.75rem" }} onClick={addItemRow}>
              <i className="bi bi-plus-lg" /> Add line
            </button>

            <div className="ri-modal-actions">
              <button type="button" className="ri-btn ri-btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="ri-btn ri-btn-primary">Save Transaction</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
