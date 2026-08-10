import { useEffect, useState } from "react";
import "../styles/data.css";
import { analyticsApi } from "../api/resources";
import PeriodSelector from "../components/PeriodSelector";

export default function ProductPerformance() {
  const [period, setPeriod] = useState("30d");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    analyticsApi.products({ period }).then(setData).finally(() => setLoading(false));
  }, [period]);

  return (
    <>
      <div className="ri-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div><h1>Product Performance</h1><p>What's selling, what isn't, and what needs restocking.</p></div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      <div className="ri-kpi-grid">
        <div className="ri-kpi-card"><span className="label">Total Products</span><div className="value">{loading ? "—" : data.kpis.total_products}</div></div>
        <div className="ri-kpi-card"><span className="label">Top Selling</span><div className="value" style={{ fontSize: "1.1rem" }}>{loading ? "—" : (data.kpis.top_selling || "—")}</div></div>
        <div className="ri-kpi-card"><span className="label">Least Selling</span><div className="value" style={{ fontSize: "1.1rem" }}>{loading ? "—" : (data.kpis.least_selling || "—")}</div></div>
        <div className="ri-kpi-card"><span className="label">Out of Stock</span><div className="value">{loading ? "—" : data.kpis.out_of_stock}</div></div>
      </div>

      {!loading && data.abc_analysis.length > 0 && (
        <div className="ri-card" style={{ marginBottom: "1.1rem" }}>
          <h3 style={{ marginTop: 0 }}>ABC Analysis</h3>
          <p style={{ color: "var(--ri-text-muted)", marginTop: 0 }}>
            Products classified by their share of total revenue — A drives ~80%, B the next 15%, C the rest.
          </p>
          <div style={{ display: "flex", gap: "1rem" }}>
            {data.abc_analysis.map((a) => (
              <div key={a.class} className="ri-card" style={{ flex: 1, boxShadow: "none", border: "1px solid #eef4f1" }}>
                <div style={{ fontSize: "1.5rem", fontWeight: 700 }}>{a.class}</div>
                <div style={{ color: "var(--ri-text-muted)" }}>{a.product_count} product{a.product_count !== 1 ? "s" : ""}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="ri-table-wrap">
        <table className="ri-table">
          <thead><tr><th>Product</th><th>Category</th><th>Units Sold</th><th>Revenue</th><th>Profit</th></tr></thead>
          <tbody>
            {(!loading && data.top_products.length === 0) && (
              <tr><td colSpan={5} style={{ textAlign: "center", color: "var(--ri-text-muted)" }}>No sales in this period.</td></tr>
            )}
            {!loading && data.top_products.map((p) => (
              <tr key={p.product}>
                <td>{p.product}</td>
                <td>{p.category}</td>
                <td>{p.sold}</td>
                <td>${p.revenue.toLocaleString()}</td>
                <td>${p.profit.toLocaleString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
