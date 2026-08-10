import { useEffect, useState } from "react";
import { Line, Doughnut } from "react-chartjs-2";
import "../charts/setup";
import { BRAND_COLORS } from "../charts/setup";
import { useAuth } from "../context/AuthContext";
import { analyticsApi } from "../api/resources";
import PeriodSelector from "../components/PeriodSelector";

const KPI_META = [
  { key: "total_revenue", label: "Total Revenue", icon: "bi-currency-dollar", money: true },
  { key: "total_orders", label: "Total Orders", icon: "bi-receipt", money: false },
  { key: "total_customers", label: "Total Customers", icon: "bi-people", money: false },
  { key: "total_profit", label: "Total Profit", icon: "bi-graph-up-arrow", money: true },
];

export default function DashboardOverview() {
  const { user } = useAuth();
  const [period, setPeriod] = useState("30d");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    analyticsApi.overview({ period }).then(setData).finally(() => setLoading(false));
  }, [period]);

  const hasData = data && data.sales_over_time.length > 0;

  return (
    <>
      <div className="ri-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div>
          <h1>Welcome back, {user?.full_name?.split(" ")[0]}</h1>
          <p>Here's what's happening with {user?.store_name}.</p>
        </div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      <div className="ri-kpi-grid">
        {KPI_META.map((meta) => {
          const kpi = data?.kpis?.[meta.key];
          return (
            <div className="ri-kpi-card" key={meta.key}>
              <span className="label">{meta.label}</span>
              <div className="value">
                {loading || !kpi ? "—" : meta.money ? `$${kpi.value.toLocaleString()}` : kpi.value.toLocaleString()}
              </div>
              <span className="change">
                {kpi?.change_pct == null ? "No prior data" : (
                  <span style={{ color: kpi.change_pct >= 0 ? "var(--ri-accent)" : "#b3261e" }}>
                    {kpi.change_pct >= 0 ? "▲" : "▼"} {Math.abs(kpi.change_pct)}% vs last period
                  </span>
                )}
              </span>
            </div>
          );
        })}
      </div>

      {!loading && !hasData && (
        <div className="ri-card">
          <div className="ri-empty-state">
            <i className="bi bi-bar-chart" />
            <h3>No sales data yet</h3>
            <p>Import a CSV/Excel file or add a transaction manually to see your revenue, top products, and category breakdown here.</p>
          </div>
        </div>
      )}

      {!loading && hasData && (
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "1.1rem" }}>
          <div className="ri-card">
            <h3 style={{ marginTop: 0 }}>Sales Over Time</h3>
            <Line
              data={{
                labels: data.sales_over_time.map((d) => d.date),
                datasets: [{
                  label: "Revenue",
                  data: data.sales_over_time.map((d) => d.revenue),
                  borderColor: "#235347",
                  backgroundColor: "rgba(35,83,71,0.08)",
                  fill: true,
                  tension: 0.35,
                  pointRadius: 0,
                }],
              }}
              options={{ plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true } } }}
            />
          </div>

          <div className="ri-card">
            <h3 style={{ marginTop: 0 }}>Top Selling Products</h3>
            {data.top_products.map((p) => (
              <div key={p.product} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid #f0f5f2" }}>
                <span>{p.product}</span>
                <strong>${p.revenue.toLocaleString()}</strong>
              </div>
            ))}
          </div>

          <div className="ri-card">
            <h3 style={{ marginTop: 0 }}>Sales by Category</h3>
            <Doughnut
              data={{
                labels: data.sales_by_category.map((c) => c.category),
                datasets: [{ data: data.sales_by_category.map((c) => c.revenue), backgroundColor: BRAND_COLORS }],
              }}
              options={{ plugins: { legend: { position: "bottom", labels: { boxWidth: 10 } } } }}
            />
          </div>

          <div className="ri-card">
            <h3 style={{ marginTop: 0 }}>Sales by Country</h3>
            {data.sales_by_country.length === 0 && <p style={{ color: "var(--ri-text-muted)" }}>No customer country data yet.</p>}
            {data.sales_by_country.map((c) => (
              <div key={c.country} style={{ display: "flex", justifyContent: "space-between", padding: "0.5rem 0", borderBottom: "1px solid #f0f5f2" }}>
                <span>{c.country}</span>
                <strong>${c.revenue.toLocaleString()}</strong>
              </div>
            ))}
          </div>

          <div className="ri-card" style={{ gridColumn: "1 / -1" }}>
            <h3 style={{ marginTop: 0 }}>Recent Activity</h3>
            {data.recent_activities.map((a, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: "0.6rem", padding: "0.5rem 0", borderBottom: "1px solid #f0f5f2" }}>
                <i className={`bi ${a.type === "sale" ? "bi-cart-check" : a.type === "import" ? "bi-cloud-upload" : "bi-exclamation-triangle"}`} style={{ color: "var(--ri-accent)" }} />
                <span>{a.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
}
