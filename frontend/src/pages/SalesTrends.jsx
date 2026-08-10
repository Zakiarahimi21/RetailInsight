import { useEffect, useState } from "react";
import { Line } from "react-chartjs-2";
import "../charts/setup";
import { analyticsApi } from "../api/resources";
import PeriodSelector from "../components/PeriodSelector";

export default function SalesTrends() {
  const [period, setPeriod] = useState("90d");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    analyticsApi.trends({ period }).then(setData).finally(() => setLoading(false));
  }, [period]);

  const hasData = data && data.daily_revenue.length > 0;
  const maxIntensity = data ? Math.max(1, ...data.weekday_heatmap.map((d) => d.intensity)) : 1;

  return (
    <>
      <div className="ri-page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "1rem" }}>
        <div><h1>Sales Trends</h1><p>Growth trajectory, smoothed trend line, and weekly seasonality.</p></div>
        <PeriodSelector value={period} onChange={setPeriod} />
      </div>

      <div className="ri-kpi-grid" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
        <div className="ri-kpi-card">
          <span className="label">Revenue This Period</span>
          <div className="value">{loading ? "—" : `$${data.growth.current_revenue.toLocaleString()}`}</div>
        </div>
        <div className="ri-kpi-card">
          <span className="label">Previous Period</span>
          <div className="value">{loading ? "—" : `$${data.growth.previous_revenue.toLocaleString()}`}</div>
        </div>
        <div className="ri-kpi-card">
          <span className="label">Growth</span>
          <div className="value">
            {loading || data.growth.change_pct == null ? "—" : (
              <span style={{ color: data.growth.change_pct >= 0 ? "var(--ri-accent)" : "#b3261e" }}>
                {data.growth.change_pct >= 0 ? "▲" : "▼"} {Math.abs(data.growth.change_pct)}%
              </span>
            )}
          </div>
        </div>
      </div>

      {!loading && !hasData && (
        <div className="ri-card"><div className="ri-empty-state"><i className="bi bi-graph-up-arrow" /><h3>Not enough data yet to show trends</h3></div></div>
      )}

      {!loading && hasData && (
        <>
          <div className="ri-card" style={{ marginBottom: "1.1rem" }}>
            <h3 style={{ marginTop: 0 }}>Daily Revenue with 7-Day Moving Average</h3>
            <Line
              data={{
                labels: data.daily_revenue.map((d) => d.date),
                datasets: [
                  { label: "Daily Revenue", data: data.daily_revenue.map((d) => d.revenue), borderColor: "#c7ddd5", backgroundColor: "transparent", pointRadius: 0, tension: 0.2 },
                  { label: "7-Day Moving Avg", data: data.moving_average_7d.map((d) => d.moving_avg), borderColor: "#051f20", backgroundColor: "transparent", pointRadius: 0, borderWidth: 2.5, tension: 0.3 },
                ],
              }}
              options={{ plugins: { legend: { position: "bottom" } } }}
            />
          </div>

          <div className="ri-card">
            <h3 style={{ marginTop: 0 }}>Weekly Seasonality</h3>
            <p style={{ color: "var(--ri-text-muted)", marginTop: 0 }}>Which days of the week drive the most revenue.</p>
            <div style={{ display: "flex", gap: "0.6rem" }}>
              {data.weekday_heatmap.map((d) => (
                <div key={d.day} style={{ flex: 1, textAlign: "center" }}>
                  <div
                    style={{
                      height: `${40 + (d.intensity / maxIntensity) * 100}px`,
                      background: `rgba(5, 31, 32, ${0.15 + d.intensity * 0.7})`,
                      borderRadius: 10,
                      display: "flex",
                      alignItems: "flex-end",
                      justifyContent: "center",
                      color: d.intensity > 0.5 ? "#fff" : "var(--ri-primary)",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      paddingBottom: "0.4rem",
                    }}
                  >
                    ${Math.round(d.revenue)}
                  </div>
                  <div style={{ marginTop: "0.4rem", fontSize: "0.8rem", color: "var(--ri-text-muted)" }}>{d.day}</div>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </>
  );
}
