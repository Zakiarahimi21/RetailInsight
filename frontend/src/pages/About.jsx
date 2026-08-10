import PublicNav from "../components/PublicNav";
import PublicFooter from "../components/PublicFooter";

const VALUES = [
  {
    icon: "bi-bullseye",
    title: "Our Mission",
    text: "To make advanced business intelligence accessible to every retail business.",
  },
  {
    icon: "bi-eye",
    title: "Our Vision",
    text: "A world where every retail business grows through data-driven decisions.",
  },
  {
    icon: "bi-lightbulb",
    title: "Why We Built It",
    text: "We saw retailers struggling with complex tools. We built RetailInsight to change that.",
  },
  {
    icon: "bi-gem",
    title: "Our Values",
    text: "Simplicity, Transparency, Innovation, and Customer Success.",
  },
];

export default function About() {
  return (
    <div>
      <PublicNav />

      <section className="ri-page-hero">
        <h1>About RetailInsight</h1>
        <p>Empowering Retailers with Data-Driven Decisions</p>
      </section>

      <section className="ri-about-mission">
        <p>
          RetailInsight was built with a simple mission: to help small retail
          businesses turn their data into meaningful insights that drive real
          growth.
          <br /><br />
          We believe in simplicity, affordability, and intelligence. Our
          platform is 100% local, secure, and built for businesses of all
          sizes.
        </p>
        <div className="ri-about-illustration">
          <i className="bi bi-shop" />
        </div>
      </section>

      <section className="ri-about-values">
        {VALUES.map((v) => (
          <div className="ri-card" key={v.title}>
            <i className={`bi ${v.icon}`} style={{ fontSize: "1.4rem", color: "var(--ri-accent)", marginBottom: "0.75rem", display: "block" }} />
            <h4>{v.title}</h4>
            <p>{v.text}</p>
          </div>
        ))}
      </section>

      <PublicFooter />
    </div>
  );
}
