import { useState, useRef, useEffect, useCallback } from "react";
import "../styles/data.css";
import { uploadApi } from "../api/resources";
import Pagination from "../components/Pagination";

const FIELD_LABELS = {
  invoice_no: "Invoice / Order No",
  product_sku: "Product SKU",
  product_name: "Product Name",
  quantity: "Quantity",
  unit_price: "Unit Price",
  unit_cost: "Unit Cost",
  invoice_date: "Date",
  customer_id: "Customer ID",
  customer_name: "Customer Name",
  country: "Country",
};

const REQUIRED_FIELDS = ["invoice_date", "quantity", "unit_price"];

// Give up polling after this many consecutive failed requests, or this much
// total wall-clock time — whichever comes first. Without a cap, a lost/dead
// job would poll silently forever with the bar frozen at 99% and no
// explanation, which is exactly the bug this replaces.
const MAX_CONSECUTIVE_FAILURES = 6;
const MAX_POLL_MINUTES = 30;
const POLL_INTERVAL_MS = 1200;

export default function ImportData() {
  const [dragging, setDragging] = useState(false);
  const [preview, setPreview] = useState(null);
  const [mapping, setMapping] = useState({});
  const [error, setError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [committing, setCommitting] = useState(false);
  const [result, setResult] = useState(null);
  const [activeImportId, setActiveImportId] = useState(null);
  const [progress, setProgress] = useState(null); // full import_log.to_dict() while watching
  const [resumedBanner, setResumedBanner] = useState(false);

  const [history, setHistory] = useState({ items: [], page: 1, pages: 1, total: 0 });
  const fileInputRef = useRef(null);

  const loadHistory = useCallback((page = 1) => {
    uploadApi.history({ page }).then(setHistory).catch(() => {});
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  // On page load, check whether an import is already running (e.g. the user
  // refreshed mid-import) and resume watching it instead of losing track of it.
  useEffect(() => {
    uploadApi.active().then((data) => {
      if (data.import) {
        setActiveImportId(data.import.id);
        setProgress(data.import);
        setCommitting(true);
        setResumedBanner(true);
      }
    }).catch(() => {});
  }, []);

  const handleFile = async (file) => {
    if (!file) return;
    setError("");
    setResult(null);
    setUploading(true);
    try {
      const data = await uploadApi.preview(file);
      setPreview(data);
      setMapping(data.suggested_mapping || {});
    } catch (err) {
      setError(err.response?.data?.errors?.file?.[0] || "Couldn't read that file.");
    } finally {
      setUploading(false);
    }
  };

  const onDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    handleFile(e.dataTransfer.files?.[0]);
  };

  useEffect(() => {
    if (!activeImportId) return;

    let active = true;
    let consecutiveFailures = 0;
    const startedAt = Date.now();

    const stopWatching = (finalError) => {
      if (!active) return;
      active = false;
      setCommitting(false);
      setActiveImportId(null);
      if (finalError) setError(finalError);
    };

    const poll = async () => {
      if (!active) return;

      if (Date.now() - startedAt > MAX_POLL_MINUTES * 60 * 1000) {
        stopWatching(
          `This import is taking longer than ${MAX_POLL_MINUTES} minutes. It may still be ` +
          `running in the background — check the Recent Imports table below in a bit, or refresh the page.`
        );
        return;
      }

      try {
        const data = await uploadApi.progress(activeImportId);
        consecutiveFailures = 0;
        if (!active) return;
        setProgress(data);

        if (data.status === "completed") {
          setResult(data);
          setPreview(null);
          loadHistory();
          stopWatching();
          return;
        }
        if (data.status === "failed") {
          stopWatching(data.error_message || "Import failed partway through — see Recent Imports for what was saved before the failure.");
          loadHistory();
          return;
        }
        setTimeout(poll, POLL_INTERVAL_MS);
      } catch (err) {
        consecutiveFailures += 1;
        if (consecutiveFailures >= MAX_CONSECUTIVE_FAILURES) {
          stopWatching(
            "Lost contact with the server while checking import progress. " +
            "Make sure the backend is still running, then check Recent Imports below — " +
            "the import may have completed even if this page couldn't confirm it."
          );
          return;
        }
        setTimeout(poll, POLL_INTERVAL_MS);
      }
    };

    poll();
    return () => { active = false; };
  }, [activeImportId, loadHistory]);

  const onCommit = async () => {
    const missing = REQUIRED_FIELDS.filter((f) => !mapping[f]);
    if (missing.length) {
      setError(`Please map: ${missing.map((f) => FIELD_LABELS[f]).join(", ")}`);
      return;
    }
    if (!mapping.product_name && !mapping.product_sku) {
      setError("Map either Product Name or Product SKU.");
      return;
    }

    setError("");
    setCommitting(true);
    setProgress({ percent: 2, status: "processing", imported_count: 0, skipped_count: 0, row_count: preview.row_count });
    try {
      const data = await uploadApi.commit({
        upload_id: preview.upload_id,
        file_name: preview.file_name,
        file_type: preview.file_type,
        mapping,
      });
      setActiveImportId(data.import.id);
    } catch (err) {
      setError(err.response?.data?.errors?.mapping?.[0] || err.response?.data?.errors?.file?.[0] || "Import failed to start.");
      setCommitting(false);
      setProgress(null);
    }
  };

  const onUndo = async (importId) => {
    if (!confirm("Undo this import? All rows it created will be removed.")) return;
    await uploadApi.undo(importId);
    loadHistory(history.page);
  };

  const percent = progress?.percent ?? 0;

  return (
    <>
      <div className="ri-page-header">
        <h1>Import Data</h1>
        <p>Bring in sales data from a CSV or Excel export — no fixed column format required.</p>
      </div>

      {resumedBanner && (
        <div className="ri-alert ri-alert-success" style={{ marginBottom: "1rem" }}>
          Resumed watching an import that was already running.
        </div>
      )}

      {!preview && (
        <div className="ri-card" style={{ marginBottom: "1.5rem" }}>
          {!committing && (
            <div
              className={`ri-dropzone${dragging ? " dragging" : ""}`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
              onDragLeave={() => setDragging(false)}
              onDrop={onDrop}
            >
              <i className="bi bi-cloud-upload" />
              <strong>Drag & Drop your CSV or Excel file</strong>
              <p style={{ color: "var(--ri-text-muted)", margin: "0.5rem 0 1rem" }}>or</p>
              <span className="ri-btn ri-btn-outline">Browse Files</span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xlsx,.xls"
                hidden
                onChange={(e) => handleFile(e.target.files?.[0])}
              />
            </div>
          )}

          {committing && (
            <ProgressBar progress={progress} />
          )}

          {uploading && <p style={{ marginTop: "1rem" }}>Reading file...</p>}
          {error && <div className="ri-alert ri-alert-error" style={{ marginTop: "1rem" }}>{error}</div>}
          {result && (
            <div className="ri-alert ri-alert-success" style={{ marginTop: "1rem" }}>
              Imported {result.imported_count} rows from {result.file_name}
              {result.skipped_count > 0 && ` (${result.skipped_count} rows skipped — duplicates or missing required data)`}.
            </div>
          )}
        </div>
      )}

      {preview && !committing && (
        <div className="ri-card" style={{ marginBottom: "1.5rem" }}>
          <h3 style={{ marginTop: 0 }}>Map your columns</h3>
          <p style={{ color: "var(--ri-text-muted)" }}>
            {preview.file_name} — {preview.row_count.toLocaleString()} rows. We pre-matched columns we recognized; adjust anything below.
          </p>

          {error && <div className="ri-alert ri-alert-error">{error}</div>}

          <div className="ri-mapping-grid">
            {Object.entries(FIELD_LABELS).map(([field, label]) => (
              <div className="ri-mapping-row" key={field}>
                <label>
                  {label}
                  {REQUIRED_FIELDS.includes(field) && " *"}
                </label>
                <select
                  value={mapping[field] || ""}
                  onChange={(e) => setMapping((m) => ({ ...m, [field]: e.target.value || undefined }))}
                >
                  <option value="">— Not mapped —</option>
                  {preview.columns.map((col) => (
                    <option key={col} value={col}>{col}</option>
                  ))}
                </select>
              </div>
            ))}
          </div>

          <div className="ri-preview-table-wrap">
            <table className="ri-table">
              <thead>
                <tr>{preview.columns.map((c) => <th key={c}>{c}</th>)}</tr>
              </thead>
              <tbody>
                {preview.preview_rows.slice(0, 5).map((row, i) => (
                  <tr key={i}>
                    {preview.columns.map((c) => <td key={c}>{row[c]}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="ri-modal-actions">
            <button className="ri-btn ri-btn-outline" onClick={() => { setPreview(null); setError(""); }}>
              Cancel
            </button>
            <button className="ri-btn ri-btn-primary" onClick={onCommit}>
              Import {preview.row_count.toLocaleString()} Rows
            </button>
          </div>
        </div>
      )}

      {preview && committing && (
        <div className="ri-card" style={{ marginBottom: "1.5rem" }}>
          <h3 style={{ marginTop: 0 }}>Importing {preview.file_name}</h3>
          <ProgressBar progress={progress} />
          <p style={{ color: "var(--ri-text-muted)", fontSize: "0.85rem", marginTop: "0.75rem" }}>
            Large files can take several minutes. You can leave this page — the import
            keeps running on the server, and you can check its status any time in Recent Imports below.
          </p>
        </div>
      )}

      <div className="ri-page-header" style={{ marginTop: "2rem" }}>
        <h1 style={{ fontSize: "1.15rem" }}>Recent Imports</h1>
      </div>
      <div className="ri-table-wrap">
        <table className="ri-table">
          <thead>
            <tr>
              <th>File Name</th>
              <th>Type</th>
              <th>Rows</th>
              <th>Imported</th>
              <th>Skipped</th>
              <th>Status</th>
              <th>Date</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {history.items.length === 0 && (
              <tr><td colSpan={8} style={{ textAlign: "center", color: "var(--ri-text-muted)" }}>No imports yet.</td></tr>
            )}
            {history.items.map((h) => (
              <tr key={h.id}>
                <td>{h.file_name}</td>
                <td>{h.file_type.toUpperCase()}</td>
                <td>{h.row_count.toLocaleString()}</td>
                <td>{h.imported_count.toLocaleString()}</td>
                <td>{h.skipped_count.toLocaleString()}</td>
                <td>
                  <span className={`ri-badge ${
                    h.status === "completed" ? "ri-badge-green" :
                    h.status === "failed" ? "ri-badge-red" :
                    h.status === "processing" ? "ri-badge-muted" : "ri-badge-muted"
                  }`} title={h.error_message || ""}>
                    {h.status === "processing" ? `${h.percent}%` : h.status}
                  </span>
                </td>
                <td>{new Date(h.created_at).toLocaleDateString()}</td>
                <td>
                  {h.status === "completed" && (
                    <button className="ri-icon-btn danger" onClick={() => onUndo(h.id)} title="Undo import">
                      <i className="bi bi-arrow-counterclockwise" />
                    </button>
                  )}
                  {h.status === "processing" && (
                    <button
                      className="ri-icon-btn"
                      title="Watch this import's progress"
                      onClick={() => { setActiveImportId(h.id); setProgress(h); setCommitting(true); setPreview({ file_name: h.file_name, row_count: h.row_count }); }}
                    >
                      <i className="bi bi-eye" />
                    </button>
                  )}
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

function ProgressBar({ progress }) {
  const percent = progress?.percent ?? 0;
  const imported = progress?.imported_count ?? 0;
  const skipped = progress?.skipped_count ?? 0;
  const total = progress?.row_count ?? 0;

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.9rem", marginBottom: "0.35rem" }}>
        <span>
          {imported.toLocaleString()} imported
          {skipped > 0 && `, ${skipped.toLocaleString()} skipped`}
          {total > 0 && ` of ${total.toLocaleString()} rows`}
        </span>
        <span>{percent}%</span>
      </div>
      <div style={{ width: "100%", height: "8px", background: "#e9ecef", borderRadius: "999px", overflow: "hidden" }}>
        <div
          style={{
            width: `${percent}%`,
            height: "100%",
            background: "linear-gradient(90deg, #235347, #8bc0b0)",
            transition: "width 0.4s ease",
          }}
        />
      </div>
    </div>
  );
}
