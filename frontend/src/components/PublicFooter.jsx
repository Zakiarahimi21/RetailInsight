import { Link } from "react-router-dom";
import logo from "../assets/logo.png";

export default function PublicFooter() {
  return (
    <footer className="ri-public-footer-full">
      <div className="ri-public-footer-grid">
        <div className="ri-public-footer-brand">
          <img src={logo} alt="RetailInsight" style={{ height: 26, filter: "brightness(0) invert(1)" }} />
          <p>Empowering retail businesses with data-driven insights and intelligent analytics to grow smarter.</p>
        </div>

        <div>
          <h5>Product</h5>
          <Link to="/features">Features</Link>
          <Link to="/#how-it-works">Solutions</Link>
          <Link to="/pricing">Pricing</Link>
        </div>

        <div>
          <h5>Company</h5>
          <Link to="/about">About Us</Link>
          <a href="#">Blog</a>
          <a href="#">Careers</a>
        </div>

        <div>
          <h5>Support</h5>
          <a href="#">Help Center</a>
          <Link to="/contact">Contact Us</Link>
          <a href="#">Documentation</a>
        </div>

        <div>
          <h5>Newsletter</h5>
          <p style={{ fontSize: "0.82rem", color: "#a9c7bc", marginBottom: "0.6rem" }}>
            Subscribe for updates and insights.
          </p>
          <form className="ri-footer-newsletter" onSubmit={(e) => e.preventDefault()}>
            <input type="email" placeholder="Your email" />
            <button type="submit"><i className="bi bi-arrow-right" /></button>
          </form>
        </div>
      </div>

      <div className="ri-public-footer-bottom">
        <span>© {new Date().getFullYear()} RetailInsight. All rights reserved.</span>
        <span className="ri-footer-bottom-links">
          <a href="#">Privacy Policy</a> | <a href="#">Terms of Service</a>
        </span>
      </div>
    </footer>
  );
}
