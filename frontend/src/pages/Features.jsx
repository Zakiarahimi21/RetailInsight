import PublicNav from "../components/PublicNav";
import PublicFooter from "../components/PublicFooter";

const FEATURES = [
  { icon: "bi-graph-up", title: "Sales Analytics", desc: "Track revenue, orders, and profit performance in real time." },
  { icon: "bi-box-seam", title: "Product Performance", desc: "See your top and bottom sellers, and what needs restocking." },
  { icon: "bi-people", title: "Customer Analytics", desc: "Understand your customers and their buying behavior." },
  { icon: "bi-stars", title: "AI Assistant", desc: "Ask questions about your business and get grounded answers." },
  { icon: "bi-cloud-sun", title: "Forecasting", desc: "Predict future sales with multiple ML models." },
  { icon: "bi-file-earmark-bar-graph", title: "Automated Reports", desc: "Generate and export reports in one click." },
  { icon: "bi-cloud-upload", title: "Data Import", desc: "Upload CSV or Excel files with automatic column mapping." },
  { icon: "bi-phone", title: "Responsive Design", desc: "Works perfectly on any device, desktop to mobile." },
];

export default function Features() {
  return (
    <div>
      <PublicNav />

      <section className="ri-page-hero ri-page-hero-features">
        <h1>Powerful Features for Every Retail Business</h1>
        <p>Everything you need to understand your business and grow faster.</p>
      </section>

      <section className="ri-features-grid">
        {FEATURES.map((f) => (
          <div className="ri-card" key={f.title}>
            <i className={`bi ${f.icon}`} />
            <h4>{f.title}</h4>
            <p>{f.desc}</p>
          </div>
        ))}
      </section>

      <PublicFooter />
    </div>
  );
}
