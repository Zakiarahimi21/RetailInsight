import { useEffect, useState } from "react";
import { Doughnut } from "react-chartjs-2";
import "../charts/setup";
import "../styles/data.css";
import { analyticsApi } from "../api/resources";
import PeriodSelector from "../components/PeriodSelector";

const SEGMENT_COLORS = { "High Value": "#051f20", "Regular": "#8bc0b0", "Low Value": "#dfeee8" };

export default function CustomerAnalytics() {
  const [period, setPeriod] = useState("30d");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    analyticsApi.customers({ period }).then(setData).finally(() => setLoading(false));
  }, [period]);

  return (
    <>
      <div className="ri-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div><h1>Customer Analytics</h1><p>Who's buying, how often, and how much they're worth.</p></div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      <div className="ri-kpi-grid">
        <div className="ri-kpi-card"><span className="label">Total Customers</span><div className="value">{loading ? "—" : data.kpis.total_customers}</div></div>
        <div className="ri-kpi-card"><span className="label">New Customers</span><div className="value">{loading ? "—" : data.kpis.new_customers}</div></div>
        <div className="ri-kpi-card"><span className="label">Returning</span><div className="value">{loading ? "—" : data.kpis.returning_customers}</div></div>
        <div className="ri-kpi-card"><span className="label">Avg Lifetime Value</span><div className="value">{loading ? "—" : `$${data.kpis.avg_clv.toLocaleString()}`}</div></div>
      </div>

      {!loading && data.segmentation.length === 0 && (
        <div className="ri-card"><div className="ri-empty-state"><i className="bi bi-people" /><h3>No customer purchase data for this period</h3></div></div>
      )}

      {!loading && data.segmentation.length > 0 && (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1.4fr", gap: "1.1rem" }}>
          <div className="ri-card">
            <h3 style={{ marginTop: 0 }}>Customer Segmentation</h3>
            <Doughnut
              data={{
                labels: data.segmentation.map((s) => s.segment),
                datasets: [{ data: data.segmentation.map((s) => s.count), backgroundColor: data.segmentation.map((s) => SEGMENT_COLORS[s.segment]) }],
              }}
              options={{ plugins: { legend: { position: "bottom", labels: { boxWidth: 10 } } } }}
            />
          </div>

          <div className="ri-table-wrap">
            <table className="ri-table">
              <thead><tr><th>Customer</th><th>Orders</th><th>Total Spend</th><th>Segment</th></tr></thead>
              <tbody>
                {data.top_customers.map((c) => (
                  <tr key={c.customer}>
                    <td>{c.customer}</td>
                    <td>{c.orders}</td>
                    <td>${c.spend.toLocaleString()}</td>
                    <td><span className={`ri-badge ${c.segment === "High Value" ? "ri-badge-green" : "ri-badge-muted"}`}>{c.segment}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </>
  );
}
