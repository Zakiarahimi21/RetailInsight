import logo from "../assets/logo.png";
import "../styles/auth.css";

export default function AuthLayout({ heading, subtext, icon, children }) {
  return (
    <div className="ri-auth-screen">
      <div className="ri-auth-panel">
        <div className="ri-auth-panel-logo">
          <img src={logo} alt="RetailInsight" />
        </div>
        <h1>{heading}</h1>
        <p>{subtext}</p>
        <div className="ri-auth-illustration">
          <i className={`bi ${icon}`} />
        </div>
      </div>

      <div className="ri-auth-form-side">
        <div className="ri-auth-form-box">{children}</div>
      </div>
    </div>
  );
}
