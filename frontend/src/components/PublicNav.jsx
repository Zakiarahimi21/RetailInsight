import { Link } from "react-router-dom";
import logo from "../assets/logo.png";

export default function PublicNav() {
  return (
    <nav className="ri-public-nav">
      <Link to="/" className="ri-public-nav-logo">
        <img src={logo} alt="RetailInsight" />
      </Link>

      <div className="ri-public-nav-right">
        <div className="ri-public-nav-links">
          <Link to="/">Home</Link>
          <Link to="/features">Features</Link>
          <Link to="/#how-it-works">Solutions</Link>
          <Link to="/pricing">Pricing</Link>
          <Link to="/about">About Us</Link>
          <Link to="/contact">Contact</Link>
        </div>
        <Link to="/login" className="ri-btn ri-btn-outline">Login</Link>
      </div>
    </nav>
  );
}
