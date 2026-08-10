import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import "../charts/setup";
import { forecastingApi } from "../api/resources";

export default function Forecasting() {
  const [data, setData] = useState(null);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModels, setShowModels] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      forecastingApi.revenue({ horizon_days: 30 }),
      forecastingApi.products({ horizon_days: 30 }),
    ])
      .then(([rev, prod]) => {
        setData(rev);
        setProducts(prod.predicted_products);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <>
        <div className="ri-page-header"><h1>Sales Forecasting</h1></div>
        <div className="ri-card">
          <div className="ri-empty-state">
            <i className="bi bi-hourglass-split" />
            <h3>Training forecast models...</h3>
            <p>Comparing Linear Regression, Random Forest, ARIMA, and Prophet against your recent sales.</p>
          </div>
        </div>
      </>
    );
  }

  if (data.status === "insufficient_data") {
    return (
      <>
        <div className="ri-page-header"><h1>Sales Forecasting</h1></div>
        <div className="ri-card">
          <div className="ri-empty-state">
            <i className="bi bi-graph-up" />
            <h3>Not enough sales history yet</h3>
            <p>
              Forecasting needs at least {data.days_required} days of sales data —
              you currently have {data.days_available}. Import more historical data
              or keep logging sales and check back soon.
            </p>
          </div>
        </div>
      </>
    );
  }

  const historyLabels = data.actual_history.slice(-45).map((d) => d.date);
  const historyValues = data.actual_history.slice(-45).map((d) => d.revenue);
  const forecastLabels = data.forecast.map((d) => d.date);
  const forecastValues = data.forecast.map((d) => d.predicted_revenue);

  return (
    <>
      <div className="ri-page-header">
        <h1>Sales Forecasting</h1>
        <p>Next 30 days, predicted from your sales history.</p>
      </div>

      <div className="ri-kpi-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="ri-kpi-card">
          <span className="label">Predicted Revenue (30d)</span>
          <div className="value">${data.predicted_total_revenue.toLocaleString()}</div>
        </div>
        <div className="ri-kpi-card">
          <span className="label">Predicted Daily Avg</span>
          <div className="value">${Math.round(data.predicted_total_revenue / data.forecast.length).toLocaleString()}</div>
        </div>
        <div className="ri-kpi-card">
          <span className="label">Model Confidence</span>
          <div className="value">{data.confidence_pct}%</div>
        </div>
      </div>

      <div className="ri-card" style={{ marginBottom: "1.1rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ margin: 0 }}>Forecast (Next 30 Days)</h3>
          <span className="ri-badge ri-badge-green">Model: {data.best_model.replace("_", " ")}</span>
        </div>
        <Line
          data={{
            labels: [...historyLabels, ...forecastLabels],
            datasets: [
              {
                label: "Actual Sales",
                data: [...historyValues, ...Array(forecastValues.length).fill(null)],
                borderColor: "#235347",
                backgroundColor: "transparent",
                pointRadius: 0,
                tension: 0.25,
              },
              {
                label: "Forecasted Sales",
                data: [...Array(historyValues.length - 1).fill(null), historyValues.at(-1), ...forecastValues],
                borderColor: "#8bc0b0",
                borderDash: [6, 4],
                backgroundColor: "transparent",
                pointRadius: 0,
                tension: 0.25,
              },
            ],
          }}
          options={{ plugins: { legend: { position: "bottom" } } }}
        />
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1.3fr 1fr", gap: "1.1rem" }}>
        <div className="ri-card">
          <h3 style={{ marginTop: 0 }}><i className="bi bi-stars" style={{ color: "var(--ri-accent)" }} /> AI Insight</h3>
          <p>{data.insight}</p>

          <button
            className="ri-btn ri-btn-outline"
            style={{ marginTop: "0.5rem" }}
            onClick={() => setShowModels((s) => !s)}
          >
            {showModels ? "Hide" : "Show"} model comparison
          </button>

          {showModels && (
            <table className="ri-table" style={{ marginTop: "1rem" }}>
              <thead><tr><th>Model</th><th>Backtest Error (MAE)</th><th>Status</th></tr></thead>
              <tbody>
                {data.model_comparison.map((m) => (
                  <tr key={m.model}>
                    <td style={{ textTransform: "capitalize" }}>{m.model.replace("_", " ")}</td>
                    <td>{m.mae != null ? `$${m.mae}` : "—"}</td>
                    <td>
                      {m.available ? (
                        m.model === data.best_model ? (
                          <span className="ri-badge ri-badge-green">Selected</span>
                        ) : (
                          <span className="ri-badge ri-badge-muted">Evaluated</span>
                        )
                      ) : (
                        <span className="ri-badge ri-badge-red" title={m.reason}>Unavailable</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        <div className="ri-card">
          <h3 style={{ marginTop: 0 }}>Top Forecasted Products</h3>
          {products.length === 0 && <p style={{ color: "var(--ri-text-muted)" }}>Not enough product-level history yet.</p>}
          {products.map((p) => (
            <div key={p.product} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid #f0f5f2" }}>
              <span>{p.product}</span>
              <strong>{p.predicted_units} units</strong>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}
