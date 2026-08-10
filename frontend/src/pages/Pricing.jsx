import { Link } from "react-router-dom";
import PublicNav from "../components/PublicNav";
import PublicFooter from "../components/PublicFooter";

const PLANS = [
  {
    icon: "bi-gift",
    name: "Free",
    desc: "Perfect for getting started with RetailInsight.",
    price: "0",
    includesLabel: "Includes:",
    features: [
      "Sales Analytics Dashboard",
      "Product Performance Analysis",
      "Customer Analytics",
      "Sales Trend Visualization",
      "Automated Business Reports",
      "Basic Sales Forecasting",
    ],
    highlight: false,
  },
  {
    icon: "bi-award",
    name: "Pro",
    desc: "Advanced analytics to grow your business.",
    price: "29",
    includesLabel: "Everything in Free, plus:",
    features: [
      "Advanced Sales Forecasting",
      "AI-Powered Business Insights",
      "Export Data (Excel / PDF)",
      "Priority Support",
    ],
    highlight: true,
  },
  {
    icon: "bi-briefcase",
    name: "Business",
    desc: "More power and collaboration for growing teams.",
    price: "59",
    includesLabel: "Everything in Pro, plus:",
    features: [
      "Team Collaboration",
      "Role-Based Access",
      "Custom Reports",
      "Priority Support (24/7)",
    ],
    highlight: false,
  },
];

const TRUST_BADGES = [
  { icon: "bi-shield-check", title: "Secure & Reliable", desc: "Your data is encrypted and 100% secure." },
  { icon: "bi-arrow-repeat", title: "Cancel Anytime", desc: "No long-term contracts. Cancel anytime." },
  { icon: "bi-headset", title: "24/7 Support", desc: "We're here to help you anytime." },
  { icon: "bi-arrow-clockwise", title: "Always Up to Date", desc: "Get the latest features automatically." },
];

export default function Pricing() {
  return (
    <div>
      <PublicNav />

      <section style={{ textAlign: "center", padding: "3.5rem 1.5rem 1rem" }}>
        <h1 style={{ fontSize: "2.1rem", fontWeight: 800, color: "var(--ri-primary)", margin: "0 0 0.75rem" }}>
          Simple, Transparent Pricing
        </h1>
        <p style={{ color: "var(--ri-text-muted)", maxWidth: 480, margin: "0 auto" }}>
          Choose the perfect plan for your retail business. Upgrade or downgrade anytime.
        </p>
      </section>

      <section className="ri-pricing-grid">
        {PLANS.map((plan) => (
          <div className={`ri-card ri-pricing-card${plan.highlight ? " highlight" : ""}`} key={plan.name}>
            <div className="ri-pricing-icon"><i className={`bi ${plan.icon}`} /></div>
            <h3>{plan.name}</h3>
            <p className="ri-pricing-desc">{plan.desc}</p>

            <div className="ri-pricing-price">
              <span className="amount">${plan.price}</span>
              <span className="period">/month</span>
            </div>

            <div className="ri-pricing-divider" />

            <div className="ri-pricing-includes">{plan.includesLabel}</div>
            <ul className="ri-pricing-features">
              {plan.features.map((f) => (
                <li key={f}><i className="bi bi-check-lg" /> {f}</li>
              ))}
            </ul>

            <Link
              to="/register"
              className={`ri-btn ${plan.highlight ? "ri-btn-primary" : "ri-btn-outline"} ri-btn-block`}
            >
              Get Started <i className="bi bi-arrow-right" />
            </Link>
          </div>
        ))}
      </section>

      <section className="ri-trust-band">
        {TRUST_BADGES.map((b) => (
          <div className="ri-trust-item" key={b.title}>
            <div className="ri-trust-icon"><i className={`bi ${b.icon}`} /></div>
            <div>
              <strong>{b.title}</strong>
              <p>{b.desc}</p>
            </div>
          </div>
        ))}
      </section>

      <PublicFooter />
    </div>
  );
}
