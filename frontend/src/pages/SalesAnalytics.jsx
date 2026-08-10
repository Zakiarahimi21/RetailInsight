import { useEffect, useState } from "react";
import { Line, Doughnut, Bar } from "react-chartjs-2";
import "../charts/setup";
import { BRAND_COLORS } from "../charts/setup";
import { analyticsApi } from "../api/resources";
import PeriodSelector from "../components/PeriodSelector";

export default function SalesAnalytics() {
  const [period, setPeriod] = useState("30d");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    analyticsApi.sales({ period }).then(setData).finally(() => setLoading(false));
  }, [period]);

  const hasData = data && data.revenue_over_time.length > 0;

  return (
    <>
      <div className="ri-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div><h1>Sales Analytics</h1><p>Revenue, order volume, and category performance.</p></div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      <div className="ri-kpi-grid">
        <div className="ri-kpi-card"><span className="label">Total Revenue</span><div className="value">{loading ? "—" : `$${data.kpis.total_revenue.toLocaleString()}`}</div></div>
        <div className="ri-kpi-card"><span className="label">Total Sales</span><div className="value">{loading ? "—" : `$${data.kpis.total_sales.toLocaleString()}`}</div></div>
        <div className="ri-kpi-card"><span className="label">Avg Order Value</span><div className="value">{loading ? "—" : `$${data.kpis.avg_order_value.toLocaleString()}`}</div></div>
        <div className="ri-kpi-card"><span className="label">Total Orders</span><div className="value">{loading ? "—" : data.kpis.total_orders.toLocaleString()}</div></div>
      </div>

      {!loading && !hasData && (
        <div className="ri-card"><div className="ri-empty-state"><i className="bi bi-graph-up" /><h3>No sales data for this period</h3><p>Try a wider date range, or import/add some transactions.</p></div></div>
      )}

      {!loading && hasData && (
        <>
          <div className="ri-card" style={{ marginBottom: "1.1rem" }}>
            <h3 style={{ marginTop: 0 }}>Revenue Over Time</h3>
            <Line
              data={{
                labels: data.revenue_over_time.map((d) => d.date),
                datasets: [{ label: "Revenue", data: data.revenue_over_time.map((d) => d.revenue), borderColor: "#235347", backgroundColor: "rgba(35,83,71,0.08)", fill: true, tension: 0.35, pointRadius: 0 }],
              }}
              options={{ plugins: { legend: { display: false } } }}
            />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.1rem" }}>
            <div className="ri-card">
              <h3 style={{ marginTop: 0 }}>Sales by Category</h3>
              <Doughnut
                data={{ labels: data.sales_by_category.map((c) => c.category), datasets: [{ data: data.sales_by_category.map((c) => c.revenue), backgroundColor: BRAND_COLORS }] }}
                options={{ plugins: { legend: { position: "bottom", labels: { boxWidth: 10 } } } }}
              />
            </div>
            <div className="ri-card">
              <h3 style={{ marginTop: 0 }}>Sales by Day</h3>
              <Bar
                data={{ labels: data.sales_by_weekday.map((d) => d.day), datasets: [{ label: "Revenue", data: data.sales_by_weekday.map((d) => d.revenue), backgroundColor: "#8bc0b0", borderRadius: 6 }] }}
                options={{ plugins: { legend: { display: false } } }}
              />
            </div>
          </div>
        </>
      )}
    </>
  );
}
