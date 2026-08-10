import { useEffect, useState } from "react";
import { productsApi, uploadApi, contactApi } from "../api/resources";

export default function Notifications() {
  const [lowStock, setLowStock] = useState([]);
  const [imports, setImports] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadMessages = () => contactApi.list({ per_page: 10 }).then((d) => setMessages(d.items));

  useEffect(() => {
    Promise.all([
      productsApi.list({ low_stock: "true", per_page: 20 }),
      uploadApi.history({ per_page: 5 }),
      contactApi.list({ per_page: 10 }),
    ])
      .then(([products, history, contact]) => {
        setLowStock(products.items);
        setImports(history.items);
        setMessages(contact.items);
      })
      .finally(() => setLoading(false));
  }, []);

  const onMarkRead = async (id) => {
    await contactApi.markRead(id);
    loadMessages();
  };

  return (
    <>
      <div className="ri-page-header"><h1>Notifications</h1><p>Stock alerts, contact messages, and recent activity.</p></div>

      {!loading && lowStock.length === 0 && imports.length === 0 && messages.length === 0 && (
        <div className="ri-card"><div className="ri-empty-state"><i className="bi bi-bell" /><h3>You're all caught up</h3><p>No stock alerts, messages, or recent import activity.</p></div></div>
      )}

      {messages.length > 0 && (
        <div className="ri-card" style={{ marginBottom: "1.1rem" }}>
          <h3 style={{ marginTop: 0 }}>Contact Messages</h3>
          {messages.map((m) => (
            <div key={m.id} style={{ padding: "0.75rem 0", borderBottom: "1px solid #f0f5f2" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "0.75rem" }}>
                <div>
                  <strong>{m.subject}</strong>
                  {!m.is_read && <span className="ri-badge ri-badge-green" style={{ marginLeft: "0.5rem" }}>New</span>}
                  <div style={{ fontSize: "0.82rem", color: "var(--ri-text-muted)", marginTop: "0.2rem" }}>
                    {m.name} · {m.email} · {new Date(m.created_at).toLocaleDateString()}
                  </div>
                  <p style={{ margin: "0.4rem 0 0", fontSize: "0.88rem" }}>{m.message}</p>
                </div>
                {!m.is_read && (
                  <button className="ri-icon-btn" title="Mark as read" onClick={() => onMarkRead(m.id)}>
                    <i className="bi bi-check2" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {lowStock.length > 0 && (
        <div className="ri-card" style={{ marginBottom: "1.1rem" }}>
          <h3 style={{ marginTop: 0 }}>Stock Alerts</h3>
          {lowStock.map((p) => (
            <div key={p.id} style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.6rem 0", borderBottom: "1px solid #f0f5f2" }}>
              <i className="bi bi-exclamation-triangle" style={{ color: "#b3261e" }} />
              <span>
                <strong>{p.name}</strong> is {p.stock_quantity === 0 ? "out of stock" : `low on stock (${p.stock_quantity} left)`}
              </span>
            </div>
          ))}
        </div>
      )}

      {imports.length > 0 && (
        <div className="ri-card">
          <h3 style={{ marginTop: 0 }}>Recent Imports</h3>
          {imports.map((i) => (
            <div key={i.id} style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.6rem 0", borderBottom: "1px solid #f0f5f2" }}>
              <i className="bi bi-cloud-upload" style={{ color: "var(--ri-accent)" }} />
              <span>Imported {i.imported_count} rows from {i.file_name} — {new Date(i.created_at).toLocaleDateString()}</span>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
