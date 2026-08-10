import { useState, useEffect, useCallback } from "react";
import "../styles/data.css";
import { reportsApi } from "../api/resources";
import Pagination from "../components/Pagination";

const ICONS = {
  sales_report: "bi-graph-up",
  monthly_sales: "bi-calendar3",
  customer_report: "bi-people",
  inventory_report: "bi-box-seam",
  executive_report: "bi-file-earmark-bar-graph",
};

export default function Reports() {
  const [types, setTypes] = useState([]);
  const [history, setHistory] = useState({ items: [], page: 1, pages: 1, total: 0 });
  const [generating, setGenerating] = useState(null); // `${type}:${format}` while in flight

  useEffect(() => {
    reportsApi.types().then((d) => setTypes(d.types));
  }, []);

  const loadHistory = useCallback((page = 1) => {
    reportsApi.history({ page }).then(setHistory);
  }, []);

  useEffect(() => { loadHistory(); }, [loadHistory]);

  const generate = async (report_type, format) => {
    setGenerating(`${report_type}:${format}`);
    try {
      const { report } = await reportsApi.generate({ report_type, format, period: "30d" });
      loadHistory();
      window.open(reportsApi.downloadUrl(report.id), "_blank");
    } finally {
      setGenerating(null);
    }
  };

  const remove = async (r) => {
    if (!confirm(`Delete ${r.file_name}?`)) return;
    await reportsApi.remove(r.id);
    loadHistory(history.page);
  };

  return (
    <>
      <div className="ri-page-header"><h1>Reports</h1><p>Generate polished PDF, Excel, or CSV reports from your live data.</p></div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem", marginBottom: "1.75rem" }}>
        {types.map((t) => (
          <div key={t.key} className="ri-card">
            <i className={`bi ${ICONS[t.key] || "bi-file-earmark"}`} style={{ fontSize: "1.6rem", color: "var(--ri-accent)" }} />
            <h3 style={{ margin: "0.75rem 0 0.25rem" }}>{t.label}</h3>
            <p style={{ color: "var(--ri-text-muted)", fontSize: "0.85rem", marginBottom: "1rem" }}>Last 30 days</p>
            <div style={{ display: "flex", gap: "0.4rem", flexWrap: "wrap" }}>
              {["pdf", "xlsx", "csv"].map((fmt) => (
                <button
                  key={fmt}
                  className="ri-btn ri-btn-outline"
                  style={{ padding: "0.4rem 0.8rem", fontSize: "0.8rem" }}
                  disabled={generating === `${t.key}:${fmt}`}
                  onClick={() => generate(t.key, fmt)}
                >
                  {generating === `${t.key}:${fmt}` ? "..." : fmt.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="ri-page-header"><h1 style={{ fontSize: "1.15rem" }}>Recent Reports</h1></div>
      <div className="ri-table-wrap">
        <table className="ri-table">
          <thead><tr><th>File</th><th>Type</th><th>Format</th><th>Generated</th><th></th></tr></thead>
          <tbody>
            {history.items.length === 0 && (
              <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--ri-text-muted)" }}>No reports generated yet.</td></tr>
            )}
            {history.items.map((r) => (
              <tr key={r.id}>
                <td>{r.file_name}</td>
                <td>{r.report_type.replace("_", " ")}</td>
                <td><span className="ri-badge ri-badge-muted">{r.file_format.toUpperCase()}</span></td>
                <td>{new Date(r.created_at).toLocaleString()}</td>
                <td>
                  <div className="ri-table-actions">
                    <a className="ri-icon-btn" href={reportsApi.downloadUrl(r.id)} target="_blank" rel="noreferrer">
                      <i className="bi bi-download" />
                    </a>
                    <button className="ri-icon-btn danger" onClick={() => remove(r)}><i className="bi bi-trash" /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <Pagination {...history} onPageChange={loadHistory} />
      </div>
    </>
  );
}
