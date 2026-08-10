import { useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import AuthLayout from "../layouts/AuthLayout";
import { authApi } from "../api/auth";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [form, setForm] = useState({ password: "", confirm_password: "" });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setErrors({});
    setSubmitting(true);
    try {
      await authApi.resetPassword(token, form);
      setDone(true);
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      setErrors(err.response?.data?.errors || { general: ["Something went wrong."] });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AuthLayout
      heading="Set a New Password"
      subtext="Choose a strong new password for your account."
      icon="bi-shield-lock"
    >
      <h2>Reset Password</h2>
      <p>Enter your new password below</p>

      {done ? (
        <div className="ri-alert ri-alert-success">
          Password reset. Redirecting you to login...
        </div>
      ) : (
        <form onSubmit={onSubmit} noValidate>
          {errors.general && <div className="ri-alert ri-alert-error">{errors.general[0]}</div>}
          {errors.token && <div className="ri-alert ri-alert-error">{errors.token[0]}</div>}

          <div className="ri-field">
            <label htmlFor="password">New Password</label>
            <input
              id="password"
              name="password"
              type="password"
              placeholder="Create a new password"
              value={form.password}
              onChange={onChange}
              required
            />
            {errors.password && <div className="ri-field-error">{errors.password[0]}</div>}
          </div>

          <div className="ri-field">
            <label htmlFor="confirm_password">Confirm New Password</label>
            <input
              id="confirm_password"
              name="confirm_password"
              type="password"
              placeholder="Confirm your new password"
              value={form.confirm_password}
              onChange={onChange}
              required
            />
            {errors.confirm_password && (
              <div className="ri-field-error">{errors.confirm_password[0]}</div>
            )}
          </div>

          <button className="ri-btn ri-btn-primary ri-btn-block" disabled={submitting}>
            {submitting ? "Resetting..." : "Reset Password"}
          </button>
        </form>
      )}

      <div className="ri-auth-footer-link">
        <Link to="/login">Back to Login</Link>
      </div>
    </AuthLayout>
  );
}
