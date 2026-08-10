import { useState, useEffect } from "react";
import Modal from "../../components/Modal";
import { categoriesApi } from "../../api/resources";

export default function CategoriesTab() {
  const [categories, setCategories] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", description: "" });
  const [error, setError] = useState("");

  const load = () => categoriesApi.list().then((d) => setCategories(d.categories));
  useEffect(() => { load(); }, []);

  const openAdd = () => { setEditing(null); setForm({ name: "", description: "" }); setError(""); setModalOpen(true); };
  const openEdit = (c) => { setEditing(c); setForm({ name: c.name, description: c.description || "" }); setError(""); setModalOpen(true); };

  const save = async (e) => {
    e.preventDefault();
    try {
      if (editing) await categoriesApi.update(editing.id, form);
      else await categoriesApi.create(form);
      setModalOpen(false);
      load();
    } catch (err) {
      setError(err.response?.data?.errors?.name?.[0] || "Something went wrong.");
    }
  };

  const remove = async (c) => {
    if (!confirm(`Delete category "${c.name}"?`)) return;
    await categoriesApi.remove(c.id);
    load();
  };

  return (
    <>
      <div className="ri-toolbar">
        <div />
        <button className="ri-btn ri-btn-primary" onClick={openAdd}>
          <i className="bi bi-plus-lg" /> Add Category
        </button>
      </div>

      <div className="ri-table-wrap">
        <table className="ri-table">
          <thead><tr><th>Name</th><th>Description</th><th></th></tr></thead>
          <tbody>
            {categories.length === 0 && (
              <tr><td colSpan={3} style={{ textAlign: "center", color: "var(--ri-text-muted)" }}>No categories yet.</td></tr>
            )}
            {categories.map((c) => (
              <tr key={c.id}>
                <td>{c.name}</td>
                <td>{c.description || "—"}</td>
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
      </div>

      {modalOpen && (
        <Modal title={editing ? "Edit Category" : "Add Category"} onClose={() => setModalOpen(false)}>
          {error && <div className="ri-alert ri-alert-error">{error}</div>}
          <form onSubmit={save}>
            <div className="ri-field">
              <label>Name</label>
              <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required />
            </div>
            <div className="ri-field">
              <label>Description</label>
              <input value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
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
