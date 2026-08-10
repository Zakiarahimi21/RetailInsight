import { useState } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import { authApi } from "../api/auth";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);
    try {
      await authApi.forgotPassword({ email });
      setSent(true);
    } catch (err) {
      setErrors(err.response?.data?.errors || { general: ["Something went wrong."] });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      heading="Forgot Password?"
      subtext="Enter your email and we'll send you a link to reset your password."
      icon="bi-envelope-check"
    >
      <h2>Forgot Password?</h2>
      <p>Enter your email and we'll send you a link to reset your password.</p>

      {sent ? (
        <div className="ri-alert ri-alert-success">
          If that email exists, a reset link has been sent. Check your inbox.
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate>
          {errors.general && <div className="ri-alert ri-alert-error">{errors.general[0]}</div>}

          <div className="ri-field">
            <label htmlFor="email">Email Address</label>
            <input
              id="email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            {errors.email && <div className="ri-field-error">{errors.email[0]}</div>}
          </div>

          <button className="ri-btn ri-btn-primary ri-btn-block" disabled={submitting}>
            {submitting ? "Sending..." : "Send Reset Link"}
          </button>
        </form>
      )}

      <div className="ri-auth-footer-link">
        <Link to="/login">Back to Login</Link>
      </div>
    </AuthLayout>
  );
}
