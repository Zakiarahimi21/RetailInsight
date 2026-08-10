import { useState, useEffect, useCallback } from "react";
import Modal from "../../components/Modal";
import Pagination from "../../components/Pagination";
import { customersApi } from "../../api/resources";

const emptyForm = { name: "", email: "", phone: "", country: "", city: "" };

export default function CustomersTab() {
  const [data, setData] = useState({ items: [], page: 1, pages: 1, total: 0 });
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");

  const load = useCallback((page = 1) => {
    customersApi.list({ page, search }).then(setData);
  }, [search]);

  useEffect(() => { load(1); }, [load]);

  const openAdd = () => { setEditing(null); setForm(emptyForm); setError(""); setModalOpen(true); };
  const openEdit = (c) => {
    setEditing(c);
    setForm({ name: c.name, email: c.email || "", phone: c.phone || "", country: c.country || "", city: c.city || "" });
    setError("");
    setModalOpen(true);
  };

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editing) await customersApi.update(editing.id, form);
      else await customersApi.create(form);
      setModalOpen(false);
      load(data.page);
    } catch (err) {
      setError(err.response?.data?.errors?.name?.[0] || "Something went wrong.");
    }
  };

  const remove = async (c) => {
    if (!confirm(`Remove "${c.name}"?`)) return;
    try {
      await customersApi.remove(c.id);
      load(data.page);
    } catch (err) {
      alert(err.response?.data?.errors?.customer?.[0] || "Couldn't remove this customer.");
    }
  };

  return (
    <>
      <div className="ri-toolbar">
        <div className="ri-search-input">
          <i className="bi bi-search" />
          <input placeholder="Search customers..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <button className="ri-btn ri-btn-primary" onClick={openAdd}>
          <i className="bi bi-plus-lg" /> Add Customer
        </button>
      </div>

      <div className="ri-table-wrap">
        <table className="ri-table">
          <thead>
            <tr><th>Name</th><th>Email</th><th>Country</th><th>City</th><th></th></tr>
          </thead>
          <tbody>
            {data.items.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--ri-text-muted)" }}>No customers yet.</td></tr>
            )}
            {data.items.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.email || "—"}</td>
                <td>{c.country || "—"}</td>
                <td>{c.city || "—"}</td>
                <td>
                  <div className="ri-table-actions">
                    <button className="ri-icon-btn" onClick={() => openEdit(c)}><i className="bi bi-pencil" /></button>
                    <button className="ri-icon-btn danger" onClick={() => remove(c)}><i className="bi bi-trash" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination {...data} onPageChange={load} />
      </div>

      {modalOpen && (
        <Modal title={editing ? "Edit Customer" : "Add Customer"} onClose={() => setModalOpen(false)}>
          {error && <div className="ri-alert ri-alert-error">{error}</div>}
          <form onSubmit={save}>
            <div className="ri-field">
              <label>Name</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="ri-field">
              <label>Email</label>
              <input type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="ri-field">
              <label>Phone</label>
              <input value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="ri-field">
              <label>Country</label>
              <input value={form.country} onChange={(e) => setForm((f) => ({ ...f, country: e.target.value }))} />
            </div>
            <div className="ri-field">
              <label>City</label>
              <input value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
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
