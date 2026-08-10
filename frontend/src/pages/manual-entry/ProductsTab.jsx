import { useState, useEffect, useCallback } from "react";
import Modal from "../../components/Modal";
import Pagination from "../../components/Pagination";
import { productsApi, categoriesApi } from "../../api/resources";

const emptyForm = { name: "", sku: "", category_id: "", unit_price: "", unit_cost: "", stock_quantity: "", reorder_level: 10 };

export default function ProductsTab() {
  const [data, setData] = useState({ items: [], page: 1, pages: 1, total: 0 });
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  const load = useCallback((page = 1) => {
    productsApi.list({ page, search }).then(setData);
  }, [search]);

  useEffect(() => { load(1); }, [load]);
  useEffect(() => { categoriesApi.list().then((d) => setCategories(d.categories)); }, []);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setError(""); setModalOpen(true); };
  const openEdit = (p) => {
    setEditing(p);
    setForm({
      name: p.name, sku: p.sku || "", category_id: "",
      unit_price: p.unit_price, unit_cost: p.unit_cost,
      stock_quantity: p.stock_quantity, reorder_level: p.reorder_level,
    });
    setError("");
    setModalOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...form,
        category_id: form.category_id || null,
        unit_price: Number(form.unit_price) || 0,
        unit_cost: Number(form.unit_cost) || 0,
        stock_quantity: Number(form.stock_quantity) || 0,
        reorder_level: Number(form.reorder_level) || 0,
      };
      if (editing) await productsApi.update(editing.id, payload);
      else await productsApi.create(payload);
      setModalOpen(false);
      load(data.page);
    } catch (err) {
      setError(err.response?.data?.errors?.name?.[0] || "Something went wrong.");
    }
  };

  const remove = async (p) => {
    if (!confirm(`Remove "${p.name}"?`)) return;
    await productsApi.remove(p.id);
    load(data.page);
  };

  return (
    <>
      <div className="ri-toolbar">
        <div className="ri-search-input">
          <i className="bi bi-search" />
          <input placeholder="Search products..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button className="ri-btn ri-btn-primary" onClick={openAdd}>
          <i className="bi bi-plus-lg" /> Add Product
        </button>
      </div>

      <div className="ri-table-wrap">
        <table className="ri-table">
          <thead>
            <tr><th>Product</th><th>SKU</th><th>Category</th><th>Price</th><th>Stock</th><th></th></tr>
          </thead>
          <tbody>
            {data.items.length === 0 && (
              <tr><td colSpan={6} style={{ textAlign: "center", color: "var(--ri-text-muted)" }}>No products yet.</td></tr>
            )}
            {data.items.map((p) => (
              <tr key={p.id}>
                <td>{p.name}</td>
                <td>{p.sku || "—"}</td>
                <td>{p.category || "—"}</td>
                <td>${p.unit_price.toFixed(2)}</td>
                <td>
                  {p.stock_quantity}{" "}
                  {p.is_low_stock && <span className="ri-badge ri-badge-red">Low</span>}
                </td>
                <td>
                  <div className="ri-table-actions">
                    <button className="ri-icon-btn" onClick={() => openEdit(p)}><i className="bi bi-pencil" /></button>
                    <button className="ri-icon-btn danger" onClick={() => remove(p)}><i className="bi bi-trash" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination {...data} onPageChange={load} />
      </div>

      {modalOpen && (
        <Modal title={editing ? "Edit Product" : "Add Product"} onClose={() => setModalOpen(false)}>
          {error && <div className="ri-alert ri-alert-error">{error}</div>}
          <form onSubmit={save}>
            <div className="ri-field">
              <label>Product Name</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="ri-field">
              <label>SKU</label>
              <input value={form.sku} onChange={(e) => setForm((f) => ({ ...f, sku: e.target.value }))} />
            </div>
            <div className="ri-field">
              <label>Category</label>
              <select
                value={form.category_id}
                onChange={(e) => setForm((f) => ({ ...f, category_id: e.target.value }))}
                style={{ width: "100%", padding: "0.75rem 1rem", borderRadius: 14, border: "1.5px solid #d9e6e0" }}
              >
                <option value="">— None —</option>
                {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
            <div className="ri-field">
              <label>Unit Price</label>
              <input type="number" step="0.01" value={form.unit_price} onChange={(e) => setForm((f) => ({ ...f, unit_price: e.target.value }))} required />
            </div>
            <div className="ri-field">
              <label>Unit Cost</label>
              <input type="number" step="0.01" value={form.unit_cost} onChange={(e) => setForm((f) => ({ ...f, unit_cost: e.target.value }))} />
            </div>
            <div className="ri-field">
              <label>Stock Quantity</label>
              <input type="number" value={form.stock_quantity} onChange={(e) => setForm((f) => ({ ...f, stock_quantity: e.target.value }))} />
            </div>
            <div className="ri-field">
              <label>Reorder Level</label>
              <input type="number" value={form.reorder_level} onChange={(e) => setForm((f) => ({ ...f, reorder_level: e.target.value }))} />
            </div>
            <div className="ri-modal-actions">
              <button type="button" className="ri-btn ri-btn-outline" onClick={() => setModalOpen(false)}>Cancel</button>
              <button className="ri-btn ri-btn-primary">Save</button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
