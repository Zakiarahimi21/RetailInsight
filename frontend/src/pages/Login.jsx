import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import { useAuth } from "../context/AuthContext";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "", remember_me: false });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const onChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);
    try {
      await login(form);
      navigate("/dashboard");
    } catch (err) {
      const apiErrors = err.response?.data?.errors;
      setErrors(apiErrors || { general: ["Something went wrong. Please try again."] });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      heading="Welcome Back!"
      subtext="Sign in to continue to your dashboard and pick up right where you left off."
      icon="bi-shop"
    >
      <h2>Login</h2>
      <p>Enter your details to access your account</p>

      {errors.general && <div className="ri-alert ri-alert-error">{errors.general[0]}</div>}

      <form onSubmit={onSubmit} noValidate>
        <div className="ri-field">
          <label htmlFor="email">Email Address</label>
          <input
            id="email"
            name="email"
            type="email"
            placeholder="Enter your email"
            value={form.email}
            onChange={onChange}
            required
          />
          {errors.email && <div className="ri-field-error">{errors.email[0]}</div>}
        </div>

        <div className="ri-field">
          <label htmlFor="password">Password</label>
          <input
            id="password"
            name="password"
            type="password"
            placeholder="Enter your password"
            value={form.password}
            onChange={onChange}
            required
          />
          {errors.password && <div className="ri-field-error">{errors.password[0]}</div>}
        </div>

        <div className="ri-auth-row-between">
          <label style={{ display: "flex", alignItems: "center", gap: "0.4rem" }}>
            <input
              type="checkbox"
              name="remember_me"
              checked={form.remember_me}
              onChange={onChange}
            />
            Remember me
          </label>
          <Link to="/forgot-password">Forgot Password?</Link>
        </div>

        <button className="ri-btn ri-btn-primary ri-btn-block" disabled={submitting}>
          {submitting ? "Logging in..." : "Login"}
        </button>
      </form>

      <div className="ri-auth-footer-link">
        Don't have an account? <Link to="/register">Sign up</Link>
      </div>
    </AuthLayout>
  );
}
