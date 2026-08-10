import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import PublicNav from "../components/PublicNav";
import PublicFooter from "../components/PublicFooter";
import "../styles/public.css";

const FEATURES = [
  { icon: "bi-graph-up", title: "Sales Analytics", desc: "Track revenue & sales performance in real time." },
  { icon: "bi-stars", title: "AI Insights", desc: "Get smart recommendations powered by AI." },
  { icon: "bi-cloud-sun", title: "Forecasting", desc: "Predict future sales with multiple ML models." },
  { icon: "bi-file-earmark-bar-graph", title: "Automated Reports", desc: "Generate reports in one click." },
];

const STEPS = [
  { icon: "bi-cloud-upload", title: "Upload Your Data", desc: "Import a CSV/Excel file or add sales manually — no fixed format required." },
  { icon: "bi-cpu", title: "Analyze Instantly", desc: "Dashboards, forecasts, and AI insights build themselves from your data." },
  { icon: "bi-graph-up-arrow", title: "Grow Your Business", desc: "Act on what you learn — restock smarter, spot trends, and plan ahead." },
];

const BARS = [40, 65, 50, 80, 60, 90, 70];

export default function Home() {
  const location = useLocation();

  // React Router doesn't auto-scroll to a #hash on navigation — this makes
  // nav links like "Solutions" (-> /#how-it-works) and "Pricing" (-> /#cta)
  // actually scroll to the right section when they land here from another page.
  useEffect(() => {
    if (location.hash) {
      const el = document.querySelector(location.hash);
      if (el) el.scrollIntoView({ behavior: "smooth" });
    }
  }, [location]);

  return (
    <div>
      <PublicNav />

      <section className="ri-hero">
        <div>
          <span className="ri-hero-eyebrow">Smart Insights, Stronger Retail</span>
          <h1>Transform Your <span>Retail Data</span> Into Business Growth</h1>
          <p>
            RetailInsight is a powerful Business Intelligence platform for retail
            businesses. Upload your data, analyze instantly, and get
            AI-powered insights to grow your revenue.
          </p>
          <div className="ri-hero-actions">
            <Link to="/register" className="ri-btn ri-btn-primary">Get Started Free</Link>
            <a href="#features" className="ri-btn ri-btn-outline" style={{ color: "#fff", borderColor: "rgba(255,255,255,0.4)" }}>
              <i className="bi bi-play-circle" /> Live Demo
            </a>
          </div>
        </div>

        <div className="ri-hero-preview-card">
          <div className="ri-hero-kpi-row">
            <div className="ri-hero-kpi">
              <span className="label">Total Revenue</span>
              <div className="value">$24,560</div>
            </div>
            <div className="ri-hero-kpi">
              <span className="label">Total Orders</span>
              <div className="value">1,245</div>
            </div>
          </div>
          <div className="ri-hero-chart-placeholder">
            {BARS.map((h, i) => (
              <div key={i} style={{ height: `${h}%` }} />
            ))}
          </div>
        </div>
      </section>

      <section className="ri-feature-strip" id="features">
        {FEATURES.map((f) => (
          <div className="ri-feature-strip-item" key={f.title}>
            <i className={`bi ${f.icon}`} />
            <h4>{f.title}</h4>
            <p>{f.desc}</p>
          </div>
        ))}
      </section>

      <section className="ri-how-it-works" id="how-it-works">
        <h2>How It Works</h2>
        <div className="ri-how-it-works-grid">
          {STEPS.map((s, i) => (
            <div className="ri-card" key={s.title}>
              <span className="ri-step-number">{i + 1}</span>
              <i className={`bi ${s.icon}`} />
              <h4>{s.title}</h4>
              <p>{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="ri-cta-band" id="cta">
        <h2>Ready to grow your retail business?</h2>
        <p>Set up your store and start analyzing your sales data in minutes.</p>
        <Link to="/register" className="ri-btn ri-btn-primary">Get Started Free</Link>
      </section>

      <PublicFooter />
    </div>
  );
}
